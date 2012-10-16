// Task View

/* todo:
 *
 
 edit task on add
 
robust scaling maths
 	findnearest doesn't correctly work after scale
 		because x/y attributes don't change
 		using jquery's position() is too slow...
 	
 reorder system
 	insert a task between two parent/child tasks
 	delete one task and have its children take its place, children are not deleted
 
 	Don't do svg text, do foreignobject text
 		this will allow you to limit the length of the text
 		make sure it's still scalable
 *   
 * limit title length in view
 * 
 * tie to google tasks and/or my own db!
 * 
 * nearestSpace functionality
 * 
 * zoom: tougher than I thought...
 * probably post on stackoverflow
 * transform: scale works on divs and stuff, and on the svg itself, but not on the rects
 * other non-css scaling methods in svg?
 * would viewbox allow me to properly scale stuff within the svg?
 Wait a minute...
 	scale the svg itself, but contain it in a div with overflow: hidden!
 	don't allow it to move vertically, must grow down
 	sides expand out as expected
 	voila
 
 instead of current overlap system...
 	prevent any subtree from overlapping any other subtree's widest element vertically?
 * 
 */


// The main sandbox for manipulating tasks
var Broccoli_Sandbox = Backbone.View.extend({

	// The SVG element
	el: $("#content_tasksvg"),
	
	// the tasks collection
	tasks: null,
	
	// config
   	taskWidth: 150,
   	taskHeight: 60,
   	taskSpacing: 20,
   	taskLeftmost: Infinity,
   	taskRightmost: 0,
   	scale: 1,
   	translation: 0,
   	mousestopTimer: null,
   	colorActiveFill: 'green',
   	colorInactiveFill: '#ffffff',
   	colorSelectedStroke: 'green',
   	colorUnselectedStroke: '#afafaf',

   	// init
	nearest: -1,
	
	events: {
		'mouseenter':  									'sandboxEnter',
		'mouseleave':									'sandboxLeave',
		'mousemove':									'updateTaskSelected',
		'mouseenter #content_tasksvg_bg':				'sandboxBgEnter',
		'click #content_tasksvg_bg':					'clickAdd',
		'click .content_tasksvg_task_close':			'clickRemove',
		'click .content_tasksvg_task_text':				'clickReviveEdit',
		'click .content_tasksvg_task_box':				'clickReviveEdit',
		'click .content_tasksvg_task_textfield_submit':	'clickSubmit',
		'mouseenter .content_tasksvg_task_box':			'enterTask',
		'mouseenter .content_tasksvg_task_close':		'enterTask',
		'mouseenter .content_tasksvg_task_text':		'enterTask',
		'submit .content_tasksvg_task_textfield_form':	'clickSubmit'
	},
	
	initialize: function(nodes) {
		// create our main collection of tasks
		this.tasks = new Broccoli_TaskList(this);
		
		/*mytasks.fetch({ 
			succes:	function() {
			alert("fetched");
			},
			error: function() {
				alert("failed");
			}
		});*/
		
		// Fill up tasks with our insta-data from PHP
		//this.tasks.reset(nodes);
		
		// Fill up the collection with data from localstorage if it exists
		this.tasks.fetch();
	},
	
	// Remove everything from the svg
	clear: function() {
		$(this.el).empty();
		
		// restore the main group
		var group = document.createElementNS('http://www.w3.org/2000/svg','g');
		group.setAttribute('id', ('content_tasksvg_group'));
		$(this.el).append(group);
		
		// restore the background
		var bg = document.createElementNS('http://www.w3.org/2000/svg','rect');
		bg.setAttribute('id', ('content_tasksvg_bg'));
		bg.setAttribute('width', '100%');
		bg.setAttribute('height', '100%');
		$(group).append(bg);
	},
	
	/*** Event Functions  ***/
	
	// Handler for mouse over the sandbox
	sandboxEnter: function(e) {
		this.nearest = this.nearestTask((e.pageX), (e.pageY - $(this.el).offset().top));
		
		// visually show nearest task
		this.setTaskSelected(this.nearest);
	},
	
	// Handler for mouse leaving the sandbox
	sandboxLeave: function() {
		// remove visual nearest indicator and over indicator
		$('.content_tasksvg_task_box').css('stroke', '#afafaf');
		$('.content_tasksvg_task_box').css('fill', '#ffffff');
	},
	
	// Handler for entering the sandbox bg (can enter from edges or from task)
	sandboxBgEnter: function() {
		// set all tasks to normal fill color
		this.setTaskInactive();
	},
	
	// Update the position of the pending task based on the mouse position
	updateTaskSelected: function(e){
		// no need to update if we're outside the svg, or hovering over a task itself
		if ($('#content_tasksvg_bg:hover')) {
			var nearestNew = this.nearestTask((e.pageX), (e.pageY - $(this.el).offset().top));
			
			// if the nearest task has changed
			if (nearestNew != this.nearest) {
				// update the visual selection
				this.setTaskSelected(nearestNew);
				
				// and update nearest
				this.nearest = nearestNew;
			}
		}
	},
	
	// Add a task nearest the cursor
	 clickAdd: function() {
		// if a task is being edited, confirm the edit, don't add a task
		if ($('.content_tasksvg_task_textfield').length) {
			this.editTaskConfirmAll();
		}
		else {
			// add a task whose parent is nearest to the mouse
			this.tasks.create({
				'id': 		this.tasks.newId(),
				'parent':	this.nearest
			});
		}
	},	
	
	// X button click to complete/delete
	clickRemove: function(e) {
		var task = this.tasks.get($(e.target).parent().data('task'));

		// if the task is completed, then fully remove it
		if (task.get('completed')) {
			this.tasks.removeSubtree(task, this);
		}
		// if the task is not completed, just mark it as completed, but don't remove it
		else {
			this.tasks.setCompletedSubtree(task);
			this.tasks.collectionUpdated(this);
		}
	},
	
	// Handler for clicking a task, either edit it or bring it back from completed status
	clickReviveEdit: function(e) {
		var id = $(e.target).parent().data('task');
		var task = this.tasks.get(id);

		// if the task is completed, bring it back to life
		if (task.get('completed')) {
			task.setIncomplete();
			this.tasks.collectionUpdated(this);
		}
		// if incomplete, edit the title
		else {
			// if we're already editing something, confirm that one first
			if ($('.content_tasksvg_task_textfield').length) {
				this.editTaskConfirmAll();
			}
			this.editTask(id);
		}
	},
	
	// Handler for submitting a task edit
	clickSubmit: function(e) {
		this.editTaskConfirmAll();
		
		// prevent the form from actually submitting	
		return false;
	},

	// Handler for hovering over any part of a task
	enterTask: function(e) {
		var id = $(e.target).data('id') ? $(e.target).data('task') : $(e.target).parent().data('task');
		this.setTaskActive(id);
	},
	
	/*** End Event Functions ***/
	
	// click to edit task text
	editTask: function(id) {
		var label = $('.content_tasksvg_task_text.task' + id);
		// if we're editing a pending task, make it real first
		/*if (this.hasClassSVG($(e.target).parent(), 'pending')) {
			this.removeClassSVG($('.content_tasksvg_task.pending'), 'pending');
		}*/
		
		// save the current text and remove it in the svg
		var text = label.get(0).textContent;
		label.get(0).textContent = '';

		// create foreign object in svg
		var field = document.createElementNS('http://www.w3.org/2000/svg','foreignObject');
		field.setAttribute('class', 'content_tasksvg_task_textfield task'+label.parent().data('task'));
		field.setAttribute('data-task', label.parent().data('task'))
		field.setAttribute('x', label.attr('x'));
		field.setAttribute('y', (label.attr('y') - 20));
		field.setAttribute('width', (this.taskWidth - 10));
		field.setAttribute('height', '50');
		// and create its body
		var fieldBody = document.createElement('body');
		fieldBody.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
		// create a form
		var fieldBodyForm = document.createElement('form');
		fieldBodyForm.setAttribute('class', 'content_tasksvg_task_textfield_form');
		// create the text input field
		var fieldBodyFormInput = document.createElement('input');
		fieldBodyFormInput.setAttribute('type', 'text');
		fieldBodyFormInput.setAttribute('value', text);
		fieldBodyFormInput.setAttribute('style', ('width: ' + (this.taskWidth - 10) + 'px'));
		// create the submit button
		var fieldBodyFormSubmit = document.createElement('input');
		fieldBodyFormSubmit.setAttribute('type', 'submit');
		fieldBodyFormSubmit.setAttribute('value', 'Edit');
		fieldBodyFormSubmit.setAttribute('class', 'content_tasksvg_task_textfield_submit');
		fieldBodyFormSubmit.setAttribute('hidden', 'hidden');
		
		// stick everything together and put it in the DOM
		fieldBodyForm.appendChild(fieldBodyFormInput);
		fieldBodyForm.appendChild(fieldBodyFormSubmit);
		fieldBody.appendChild(fieldBodyForm);
		field.appendChild(fieldBody);
		$(this.el).append(field);

		// select the input text for the user
		var input = $('.content_tasksvg_task_textfield.task'+label.parent().data('task')).find('input[type=text]').get(0);
		input.select();
	},
	
	// Confirm all open task edits
	editTaskConfirmAll: function() {
		var sandbox = this;
		if ($('.content_tasksvg_task_textfield').length) {
			$('.content_tasksvg_task_textfield').each(function() {
				var id = $(this).data('task');
				var input = $(this).find('input[type=text]');
				var task = sandbox.tasks.get(id);
		
				// remove the textfield
				$(this).remove();

				// write the update and refresh the view
				task.save({'title': $(input).attr('value')});
			});
		}

		// refresh the view
		this.tasks.collectionUpdated(this)
	},
	
	// Set a task as visually active (and clear any other active tasks)
	setTaskActive: function(id) {
		// set all as inactive
		$('.content_tasksvg_task_box').css('fill', this.colorInactiveFill);
		
		// set given as active
		$('.content_tasksvg_task_box.task' + id).css('fill', this.colorActiveFill);
	},
	
	// Set a task as visually inactive, or if no id given, set all inactive
	setTaskInactive: function(id) {
		var whichSelect = (id == undefined) ? '' : ('.task' + id);
		$('.content_tasksvg_task_box' + whichSelect).css('fill', '#ffffff');
	},
	
	// Set a task as visually selected (and clear any other selected tasks)
	setTaskSelected: function(id) {
		// set all as unselected
		$('.content_tasksvg_task_box').css('stroke', this.colorUnselectedStroke);
		
		// set given as selected
		$('.content_tasksvg_task_box.task'+id).css('stroke', this.colorSelectedStroke);
	},
	
	// Set a task as visually unselected, or if no id given, set all unselected
	setTaskUnselected: function(id) {
		var whichSelect = (id == undefined) ? '' : ('.task' + id);
		$('.content_tasksvg_task_box' + whichSelect).css('stroke', this.colorUnselectedStroke);
	},
	
	// Remove a task from the view
/*    removeTask: function(which) {
    	// remove the task from its parent's children data
    	var parent = $(".content_tasksvg_task.task"+which).data("parent");
    	var children = $(".content_tasksvg_task.task"+parent).data("children");
    	var index = children.indexOf(which);
    	children.splice(index, 1);
    	$(".content_tasksvg_task.task"+$(".content_tasksvg_task.task"+which).data("parent")).data("children", children);
    	
    	// physically remove the task from the dom and from our count
		$(".content_tasksvg_task.task"+which).remove();
		
		// reposition its siblings and their children
		if (parent != -1) {
    		this.restructureTree(parent);
    	}
    },
*/	
    // clear the view and render everything in this.tasks
	render: function() {
		this.clear();

		// loop through and add each task
		var sandbox = this;
		this.tasks.each(function(task, key) {
			var id = task.get('id');
	    	var parent = task.get('parent');
		    var pending = task.get('dontSync') ? true : false;
		    var text = task.get('title');

			var opacity = task.get('completed') ? 0.3 : 1;
	    	
	    	var x = ($("#content").width() / 2 - sandbox.taskWidth / 2);
	    	var y = 0;
	    	var level = 0;
	
			// if we're not adding the very first task
	    	if (parent != -1) {
	    		y = parseInt($(".content_tasksvg_task_box.task"+parent).attr("y")) + 100;
	    		
	    		level = parseInt(sandbox.tasks.get(parent).get('level')) + 1;
	    	}
	
			// create the group for the whole task
	    	var group = document.createElementNS('http://www.w3.org/2000/svg','g');
	    	var pendingClass = pending ? ' pending' : '';
	    	group.setAttribute('class', ('content_tasksvg_task task'+id+pendingClass));
			group.setAttribute('style', 'opacity: ' + opacity + ';');
			group.setAttribute('transform', 'scale(' + sandbox.scale + ')translate(' + sandbox.translation + ')');
	
			// create the rect
	    	var taskBox = document.createElementNS('http://www.w3.org/2000/svg','rect');
	    	taskBox.setAttribute('class', ('content_tasksvg_task_box task'+id));
	    	taskBox.setAttribute('x', x);
	    	taskBox.setAttribute('y', y);
	    	taskBox.setAttribute('rx', '10');
	    	taskBox.setAttribute('ry', '10');
	    	taskBox.setAttribute('width', sandbox.taskWidth);
	    	taskBox.setAttribute('height', sandbox.taskHeight);
	    	group.appendChild(taskBox);
	        
	        // create the title text
	        var taskText = document.createElementNS('http://www.w3.org/2000/svg','text');
	        taskText.setAttribute('class', ('content_tasksvg_task_text task'+id));
	        taskText.setAttribute('x', (x + 5));
	        taskText.setAttribute('y', (y + 40));
	        taskText.setAttribute('textLength', sandbox.taskWidth);
	    	var textNode = document.createTextNode(text);
	        taskText.appendChild(textNode);
	        group.appendChild(taskText);
	        
	        // create the X button
	        var close = document.createElementNS('http://www.w3.org/2000/svg','text');
	        close.setAttribute('class', ('content_tasksvg_task_close task'+id));
	        close.setAttribute('x', (x + sandbox.taskWidth - 16));
	        close.setAttribute('y', (y + 16));
	        close.setAttribute('textLength', 20);
	        var closeText = document.createTextNode('X');
	        close.appendChild(closeText);
	        group.appendChild(close);
	        
	        // create the connector to its parent (if it has one)
	        if (parent != -1) {
		    	var connect = document.createElementNS('http://www.w3.org/2000/svg','line');
		    	connect.setAttribute('class', 'content_tasksvg_connector task'+parent+' task'+id);
		    	connect.setAttribute('x1', sandbox.getTaskMidX(parent));
		    	connect.setAttribute('y1', sandbox.getTaskMidBotY(parent));
		    	connect.setAttribute('x2', (x + (sandbox.taskWidth / 2)));
		    	connect.setAttribute('y2', y);
	    		group.appendChild(connect);
	        }
	
			// put it in the dom
	    	$("#content_tasksvg_group").append(group);
	
	    	// set data attributes
	    	$('.content_tasksvg_task.task'+id).data('task', id);
	    	$('.content_tasksvg_task.task'+id).data('parent', parent);
	    	$('.content_tasksvg_task.task'+id).data('children', task.get('children'));
	    	$('.content_tasksvg_task.task'+id).data('level', level);
	    	
			// FIXME use aanother view!
			// var taskview = new Broccoli_Taskview();
	    });
    	
    	// reposition the nodes properly
    	for (i in this.tasks.tops) {
    		this.restructureTree(this.tasks.tops[i]);
    	}
    	
    	// scale properly
    	var trueLeftmost = ($("#content").width() / 2 - sandbox.taskWidth / 2) - (($("#content").width() / 2 - sandbox.taskWidth / 2) - this.taskLeftmost) * this.scale;
    	if (trueLeftmost <= 0) {
    		var group = $('#content_tasksvg_group').get(0);
    		
    		// calculate the scale properties
    		this.scale = this.scale / 1.3;
    		var width = (($("#content").width() / 2 - sandbox.taskWidth / 2) - this.taskLeftmost) * 2;
    		this.translation = width - width * this.scale;
    		//($("#content").width() / 2) * (1 - this.scale);
    		
    		// scale the tree
    		group.setAttribute('transform', 'scale(' + this.scale + ') translate(' + this.translation + ')');
    		
    		/*// resize the svg itself
    		this.scale = this.scale / 1.1;
	    	$(this.el).css({
    			'-moz-transform': 'scale(' + this.scale + ')'
    		});
    		
    		// adjust the width to fit everything if needed
    		var width = this.taskRightmost - this.taskLeftmost;
    		var left = '-100px';
    		if (width <= 0) {
    			width = $(this.el).parent().width();
    		}
    		width = width * 1.7;
	    	$(this.el).css({
    			'width': width + 'px',
    			'left': left
    		});
    		
    		// reposition the tree
    		var reposHeight = $(this.el).parent().offset().top - $(this.el).offset().top;
    		$(this.el).css({
    			'top': reposHeight + 'px'
    		});*/
    	}
    	
/*    	$(this.el).animate({
    		transform: 'scale(2)',
			left: '200px'
    	}, 1000);
    	
    	$(this.el).effect("scale", {percent: 200, direction: 'horizontal' }, 1000);
 */
    },
    
    // reposition all nodes, and spread out if necessary to prevent overlap
    restructureTree: function(top, spacing) {
		var level = this.tasks.getLevel(this.tasks.get(top));
		spacing = (spacing == undefined) ? this.getSpacingAt(level + 1) : spacing;
    	
    	this.restructureTreePosition(top, spacing);
    	
    	// check for overlap and spread out this level if there is overlap
		var task = this.tasks.get(top);
		var height = this.tasks.getHeight(task);
		
		for (var i = (height - 1); i >= 0; i--) {
			var overlapping = this.getOverlap(level + 1 + i);
			while (overlapping.length) {
				// restructure the tree at the nearest common ancestor of the overlapping nodes!
				var ancestor = this.tasks.getNearestCommonAncestor(this.tasks.get(overlapping[0]), this.tasks.get(overlapping[1]));
				this.restructureTreePosition(ancestor.get('id'), (this.getSpacingAt(parseInt(ancestor.get('level') + 1)) + this.taskWidth / 2 + this.taskSpacing / 2));
				var overlapping = this.getOverlap(level + 1 + i);
			}
		}
    },
    
    // recursively repositions all nodes below the given node, at the given spacing
    restructureTreePosition: function(top, spacing) {
    	var children =  $(".content_tasksvg_task.task"+top).data("children");

    	var numChildren = children.length;
		for (var i = 0; i < numChildren; i++) {
			 // left or right of center?
			var sign = (i < Math.floor(children.length / 2)) ? -1 : 1;
			
			// calculate the offset based on distance from center nodes
			var offset = sign * (this.taskWidth + spacing) * Math.floor(Math.abs(i -((children.length - 1) / 2)));
			
			// if there are an odd # of children, not centered, a offset by half
			if (children.length % 2 == 0) {
				offset = offset + (sign * (this.taskWidth / 2 + spacing / 2));
			}
			
			var position = (parseInt($(".content_tasksvg_task_box.task"+top).attr("x")) + offset);
			
			// reposition this child
			this.moveTaskTo(children[i], position);
			
			// check if it's leftmost or rightmost and keep track of the position if so
			if (position < this.taskLeftmost) {
				this.taskLeftmost = position;
			}
			if (position > (this.taskRightmost + this.taskWidth)) {
				this.taskRightmost = (position + this.taskWidth);
			}
			
			// and recursively restructure all of this child's children, if it has any
			if ($(".content_tasksvg_task.task"+children[i]).data('children').length > 0) {
				this.restructureTreePosition(children[i], this.getSpacingAt(parseInt($(".content_tasksvg_task.task"+children[i]).data("level")) + 1));
			}
		}

		var level = this.tasks.getLevel(this.tasks.get(top)) + 1;
		
		return;
	},
    
	// returns array of ids of first overlapping nodes on the given level, emtpy array if no overlap
    getOverlap: function(level) {
    	// get all nodes on this level
    	var bb_atlevel = this.tasks.getAtLevel(level);
    	
    	var taken = [];
    	// FIXME O(n^2)
    	for (var i in bb_atlevel) {
    		var start = parseInt($(".content_tasksvg_task_box.task"+bb_atlevel[i].get('id')).attr("x"));
    		
    		// construct an object for the task with id, start position, and end position
    		var takenTask = {'id': bb_atlevel[i].get('id'), 'start': start, 'end': (start + this.taskWidth + this.taskSpacing)};
    		
    		for (j in taken) {
    			// beginning in a taken range
    			if ((takenTask['start'] >= taken[j]['start']) && ((takenTask['start'] < taken[j]['end']))) {
    				return [takenTask['id'], taken[j]['id']];
    			}
    			// end in a taken range
    			if ((takenTask['end'] > taken[j]['start']) && ((takenTask['end'] <= taken[j]['end']))) {
    				return [takenTask['id'], taken[j]['id']];
    			}
    			// directly on top
    			if ((takenTask['start'] == taken[j]['start']) && ((takenTask['end'] == taken[j]['end']))) {
    				return [takenTask['id'], taken[j]['id']];
    			}
    		}
    		
    		taken.push(takenTask);
    	}
    	
    	return [];
    },
    
    // Returns the amount of spacing between elements in a given level
    getSpacingAt: function(level) {
    	// Level 0 simple case, just the root, no spacing, we'll say taskSpacing
    	if (level == 0) {
    		return this.taskSpacing;
    	}
    	
    	// get all nodes on this level
    	var bb_atlevel = this.tasks.getAtLevel(level);
    	
    	// find a pair of siblings
    	var siblings = [];
    	var i = 0;
    	while ((siblings.length < 2) && bb_atlevel.length) {
    		var parent = this.tasks.get(bb_atlevel[i].get('parent'));
    		siblings = parent.get('children');
    		i++;
    		
    		// if there are no siblings, then spacing must be normal
    		if (siblings == undefined) {
    			alert("sibs undefined, level " + level + ' and parent ' + parent);
    		}
    		if ((i >= bb_atlevel.length) && (siblings.length < 2)) {
    			return this.taskSpacing;
    		}
    	}
    	
    	// If there is nothing at this level, just return taskSpacing
    	if (bb_atlevel.length == 0) {
    		return this.taskSpacing;
    	}
    	
    	var sib1x = $(".content_tasksvg_task_box.task"+siblings[0]).attr('x');
    	var sib2x = $(".content_tasksvg_task_box.task"+siblings[1]).attr('x');
    	
    	// if a sibling isn't placed yet, just return taskSpacing
    	if ((sib1x == undefined) || (sib2x == undefined)) {
    		return this.taskSpacing;
    	}
    	
    	var spacing = (Math.abs(sib1x - sib2x) - this.taskWidth);
    	
    	// a row in the process of an add will give a negative spacing, just return taskSpacing if so
    	return (spacing < this.taskSpacing) ? this.taskSpacing : spacing;
    },
    
    // moves given task's rect, text, and connectors to given X coordinate
    moveTaskTo: function(which, where) {
    	$(".content_tasksvg_task_box.task"+which).get(0).setAttribute('x', where);
    	$(".content_tasksvg_task_text.task"+which).get(0).setAttribute('x', (where + 5));
    	$(".content_tasksvg_task_close.task"+which).get(0).setAttribute('x', (where + this.taskWidth - 16));
    	// move connector based on parent's position
    	var parentPos = parseInt($('.content_tasksvg_task_box.task'+$('.content_tasksvg_task.task'+which).data('parent')).attr('x'));
    	$(".content_tasksvg_connector.task"+which).get(0).setAttribute('x1', (parentPos + (this.taskWidth / 2)));
    	$(".content_tasksvg_connector.task"+which).get(0).setAttribute('x2', (where + (this.taskWidth / 2)));
    	// move the edit textfield if it's open
    	if ($('.content_tasksvg_task_textfield.task'+which).length) {
    		$('.content_tasksvg_task_textfield.task'+which).get(0).setAttribute('x', (where + 5));
    	}
    },
    
    // returns the id of the non-pending task nearest and above the given coordinates O(n)
    nearestTask: function(x, y) {
    	var nearestTask;
    	var nearestDistance = Infinity;
    	var sandbox = this;
    	$('.content_tasksvg_task:not(.pending) > .content_tasksvg_task_box').each( function() {
    		// find the point on the task nearest to x,y
    		var taskNearest = sandbox.nearestTaskPoint($(this).parent().data('task'), x, y);
    		
    		// calculate distance to this point
    		var currentDistance = sandbox.distance(taskNearest[0], taskNearest[1], x, y);
    		
    		// if this distance is the closest so far, save it
    		if ((currentDistance < nearestDistance) && (y > taskNearest[1])) {
    			nearestDistance = currentDistance;
    			nearestTask = $(this).parent().data('task');
    		}
    	});
    	
    	// If nothing above, return the root
    	if (nearestTask == undefined) {
    		nearestTask = this.tasks.at(0).get('id');
    	}
		return nearestTask;
    },
    
    // returns the point on a task nearest the given coordinates O(1)
    nearestTaskPoint: function(id, x, y) {
    	var taskDom = $('.content_tasksvg_task_box.task' + id);
    	
    	// find the extremeties of the task
    	var furthestNorth = parseInt($(taskDom).attr('y'));
    	var furthestEast = parseInt($(taskDom).attr('x')) + this.taskWidth;
       	var furthestSouth = parseInt($(taskDom).attr('y')) + this.taskHeight;
    	var furthestWest = parseInt($(taskDom).attr('x'));
    	
    	// get the nearest x coordinate on the task
    	var nearestX;
    	if (x < furthestWest) {
    		nearestX = furthestWest;
    	}
    	else if (x > furthestEast) {
    		nearestX = furthestEast;
    	}
    	else {
    		nearestX = x;
    	}
    	
    	// get the nearest y coordinate on the task
    	var nearestY;
    	if (y < furthestNorth) {
    		nearestY = furthestNorth;
    	}
    	else if (y > furthestSouth) {
    		nearestY = furthestSouth;
    	}
    	else {
    		nearestY = y;
    	}
    	
    	return [nearestX, nearestY];
    },
    
    // Math functions that I'd like to move to a separate js file!
	getTaskMidX: function(which) {
    	if (which == -1) {
    		return 0;
    	}
    	else {
    		return parseInt($(".content_tasksvg_task_box.task"+which).attr('x')) + (parseInt($(".content_tasksvg_task_box.task"+which).attr('width')) / 2);
    	}
    },
    getTaskMidBotY: function(which) {
    	if (which == -1) {
			return 0;
		}
		else {
			return parseInt($(".content_tasksvg_task_box.task"+which).attr('y')) + parseInt($(".content_tasksvg_task_box.task"+which).attr('height'));
		}
    },
    getTaskMidTopY: function(which) {
    	return parseInt($(".content_tasksvg_task_box.task"+which).attr('y'));
    },
    // distance between two points!
    distance: function(x1, y1, x2, y2) {
    	return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
    },
    
    // Cool jQuery SVG functions
    // jQuery's removeClass doesn't work for SVG, but this does!
    removeClassSVG: function(obj, remove) {
    	var classes = $(obj).attr('class');
    	var index = classes.search(remove);
    	
    	// string manipulation to remove the class
    	classes = classes.substring(0, index) + classes.substring((index + remove.length), classes.length);
    	
    	// set the new string as the object's class
    	$(obj).attr('class', classes);
    },
    // jQuery's hasClass doesn't work for SVG, but this does!
    hasClassSVG: function(obj, has) {
    	var classes = $(obj).attr('class');
    	var index = classes.search(has);
    	
    	if (index == -1) {
    		return false;
    	}
    	else {
    		return true;
    	}
    }
});
