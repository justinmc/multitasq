// The main sandbox for manipulating tasks
var Multitasq_Sandbox = Backbone.View.extend({

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
   	taskBottommost: 0,
   	taskTitleLength: 18,
   	scaleDownStep: .6,
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
		'click .content_tasksvg_task_minimize':			'clickMinimize',
		'click .content_tasksvg_task_updown':			'clickUpdown',
		'click .content_tasksvg_task_text':				'clickReviveEdit',
		'click .content_tasksvg_task_box':				'clickReviveEdit',
		'click .content_tasksvg_task_textfield_submit':	'clickSubmit',
		'mouseenter .content_tasksvg_task_box':			'enterTask',
		'mouseenter .content_tasksvg_task_close':		'enterTask',
		'mouseenter .content_tasksvg_task_text':		'enterTask',
		'submit .content_tasksvg_task_textfield_form':	'clickSubmit',
		'keyup':										'keypress'
	},
	
	initialize: function(nodes) {
		// create our main collection of tasks
		this.tasks = new Multitasq_TaskList(this);
		
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
		
		// reset stored values
		this.taskLeftmost = Infinity;
		this.taskRightmost = 0;
		this.taskBottommost = 0;
		
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
			// get the dimensions of the viewBox and real SVG
			var widthSVG = $('#content').width();
			var heightSVG = $('#content').height();
			var widthViewBox = this.getViewBoxWidth();
			var heightViewBox = this.getViewBoxHeight();
			
			// convert real coords to viewBox coords
			var x = e.pageX * widthViewBox / widthSVG;
			var y = (e.pageY - $(this.el).offset().top) * heightViewBox / heightSVG;
			
			// find the point nearest to this in viewBox coords
			var nearestNew = this.nearestTask(x, y);
			
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
		// can't add a task to a minimized parent
		else if (!this.tasks.get(this.nearest).get("minimized")) {
			// add a task whose parent is nearest to the mouse
			var id = this.tasks.newId();
			this.tasks.create({
				'id': 		id,
				'parent':	this.nearest
			});
			
			// start editing the task
			this.editTask(id);
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
	
	// - button click to minimize/expand
	clickMinimize: function(e) {
		var task = this.tasks.get($(e.target).parent().data('task'));
		
		// if the task has no children, you cannot minimize/expand
		if (task.get("children").length > 0) {
			task.toggleMinimized();
			this.tasks.collectionUpdated(this);
		}
	},
	
	// updown arrow buttons to send a task to top or restore
	clickUpdown: function(e) {
		var task = this.tasks.get($(e.target).parent().data('task'));
		
		task.toggleUpdown();
		this.tasks.collectionUpdated(this);
	},
	
	// Handler for clicking a task, either edit it or bring it back from completed status
	clickReviveEdit: function(e) {
		var id = $(e.target).parent().data('task');
		var task = this.tasks.get(id);

		// the task's parent must not be completed
		if ((task.get('level') == 0) || !this.tasks.get(task.get('parent')).get('completed')) {
			// if the task is completed, bring it back to life
			if (task.get('completed')) {
				this.tasks.setIncompleteSubtree(task);
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
	
	// Read keypresses
	keypress: function(e) {
		// if the escape key is hit, cancel all edits
		if (e.keyCode == 27) {
			this.editTaskCancel();
		}
	},
	
	/*** End Event Functions ***/
	
	// click to edit task text
	editTask: function(id) {
		var label = $('.content_tasksvg_task_text.task' + id);
		var task = this.tasks.get(id);
		
		// remove the current text in the svg
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
		fieldBodyFormInput.setAttribute('value', task.get('title'));
		fieldBodyFormInput.setAttribute('style', ('width: ' + (this.taskWidth - 22) + 'px'));
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
	
	// Cancel all open task edits without saving
	editTaskCancel: function() {
		if ($('.content_tasksvg_task_textfield').length) {
			var sandbox = this;
			$('.content_tasksvg_task_textfield').each(function() {
				// get the task's id
				var id = $(this).data('task');
		
				// revert to the title stored in data
				var label = $('.content_tasksvg_task_text.task' + id);
				label.get(0).textContent = sandbox.tasks.get(id).get('title').substring(0, sandbox.taskTitleLength) + "...";
		
				// remove the textfield
				$(this).remove();
			});
		}
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
		var task = this.tasks.get(id);
		
		// set all as inactive
		$('.content_tasksvg_task_box').css('fill', this.colorInactiveFill);
		
		// set given as active by...
		// coloring it
		$('.content_tasksvg_task_box.task' + id).css('fill', this.colorActiveFill);
		// and showing the full title
//		$('.content_tasksvg_task_text.task' + id).text(task.get('title'));
//		$('.content_tasksvg_task_box.task' + id).attr('width', '200');
	},
	
	// Set a task as visually inactive, or if no id given, set all inactive
	setTaskInactive: function(id) {
		var whichSelect = (id == undefined) ? '' : ('.task' + id);
		
		// make it normal color
		$('.content_tasksvg_task_box' + whichSelect).css('fill', '#ffffff');
		
		// limit the title length again
		$('.content_tasksvg_task_text' + whichSelect).text(text);
		if (id != undefined) {
			var task = this.tasks.get(id);
			var text = task.get('title').substring(0, this.taskTitleLength) + "...";
			$('.content_tasksvg_task_text' + whichSelect).text(text);
		}
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
		var sandbox = this;
	
		// clear anything existing in the view
		this.clear();
    	
    	// create and reposition the nodes properly
    	this.renderSubtree(this.tasks.top);
    	this.bushifyTree(this.tasks.top);
    	
    	// if we exceeded the screen, shrink and rerender
    	var viewBoxWidthScaled = this.getViewBoxWidth() * this.scaleDownStep;
    	var viewBoxHeightScaled = this.getViewBoxHeight() * this.scaleDownStep;
    	var treeWidth = this.taskRightmost - this.taskLeftmost;
    	var taskBottomBuff = this.taskBottommost + this.taskSpacing * 2;
    	if ((this.taskLeftmost <= 0) || (this.taskRightmost > this.getViewBoxWidth()) || (taskBottomBuff > this.getViewBoxHeight())) {
			sandbox.scale(1 / this.scaleDownStep);
		}
		// otherwise if we can grow by one step and still fit on screen, without getting ugly huge, scale and rerender
		else if ((treeWidth < viewBoxWidthScaled) && (taskBottomBuff < viewBoxHeightScaled) && ((this.taskWidth / viewBoxWidthScaled) < .12)) {
			sandbox.scale(this.scaleDownStep);
		}
    },
    
    // breadth first recursively renders a subtree
    renderSubtree: function(id) {
    	var task = this.tasks.get(id);
    	
    	// render this task
    	var taskview = new Multitasq_TaskView(task);
		taskview.render(this);
		
		// render this task's children if not minimized
		if (!task.get("minimized")) {
			var children = task.get("children");
			for (var i in children) {
				this.renderSubtree(children[i]);
			}
			
			// if no children, check if bottommost and record if so
			if (!children.length) {
				var bottom = parseInt($(".content_tasksvg_task_box.task"+id).attr("y")) + this.taskHeight;
				if (bottom > this.taskBottommost) {
					this.taskBottommost = bottom;
				}
			}
		}
    },
    
    // depth-first recursively spread out nodes to prevent overlap
    // returns left/right limits, calculated as distance from center of node
    bushifyTree: function(top) {
    	var children = $(".content_tasksvg_task.task"+top).data("children") || [];

    	// base case spacing: 0 children
    	var limits = {left: (this.taskWidth / 2 + this.taskSpacing / 2), right: (this.taskWidth / 2 + this.taskSpacing / 2)};
    	
    	if (children.length > 0) {
			// get limits of children and overall width
			var limitsChildren = [];
			var width = 0;
			for (var i = 0; i < children.length; i++) {
				var limitsChild = this.bushifyTree(children[i]);
				
				limitsChildren.push(limitsChild);
				
				width = width + limitsChild.left + limitsChild.right;
			}
			
			// set the limits of this parent
	    	var limits = {left: width / 2, right: width / 2};
			var center = parseInt($(".content_tasksvg_task_box.task"+top).attr("x")) + this.taskWidth / 2;
			var limitsAbs = {left: (center - limits.left), right: (center + limits.right)};
	    	
	    	// check if it's left or right overall and keep track of the position if so
			if (limitsAbs.left < this.taskLeftmost) {
				this.taskLeftmost = limitsAbs.left;
			}
			if (limitsAbs.right > this.taskRightmost) {
				this.taskRightmost = limitsAbs.right;
			}
			
			// position children if more than 1 child
			if (children.length > 1) {
				var limitLeft = width / 2 * -1 + this.taskWidth / 2;
			
				for (var i = 0; i < children.length; i++) {
					// reposition this child and its subtree
					var goto = limitLeft + limitsChildren[i].left - this.taskWidth / 2;
				
					this.translateTreeBy(children[i], goto);
				
					limitLeft = limitLeft + limitsChildren[i].left + limitsChildren[i].right;
				}
			}
	    }
	    
	    return limits;
    },
    
    // recursively translate the x position of an entire tree/subtree by the given amount
    translateTreeBy: function(id, x) {
	    var children =  $(".content_tasksvg_task.task"+id).data("children");
		var xOld = parseInt($(".content_tasksvg_task_box.task"+id).attr('x'));
		
		// move the top node
    	this.moveTaskTo(id, (xOld + x));
    	
    	// move its children if it has any
    	if (children != undefined) {
			for (var i = 0; i < children.length; i++) {
				this.translateTreeBy(children[i], x);
			}
    	}
    },
    
	// scales the svg by the given amount
	scale: function(factor) {
		// get the viewBox width and height of the svg
		var width = this.getViewBoxWidth();
		var height = this.getViewBoxHeight();
		
		// scale these parameters
		width = Math.round(width * factor);
		height = Math.round(height * factor);

		// set these as viewBox on the SVG
		$(this.el)[0].setAttribute('viewBox', '0 0 ' + width + ' ' + height);

		// rerender the view in order to center it
		this.render();
	},
    
    // moves given task's rect, text, and connectors to given X coordinate
    moveTaskTo: function(which, where) {
    	$(".content_tasksvg_task_box.task"+which).get(0).setAttribute('x', where);
    	$(".content_tasksvg_task_text.task"+which).get(0).setAttribute('x', (where + 5));
    	$(".content_tasksvg_task_close.task"+which).get(0).setAttribute('x', (where + this.taskWidth - 16));
    	$(".content_tasksvg_task_updown.task"+which).get(0).setAttribute('x', (where + this.taskWidth - 54));
    	$(".content_tasksvg_task_minimize.task"+which).get(0).setAttribute('x', (where + this.taskWidth - 32));
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
    		nearestTask = this.tasks.top;
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
    
    // gets the height of the SVG according to its viewBox (if it exists)
    getViewBoxWidth: function() {
    	// if there is no viewBox yet, just return the size of the container
    	if ($(this.el)[0].getAttribute('viewBox') == undefined) {
    		return $('#content').width();
    	}
    	else {
    		var params = $(this.el)[0].getAttribute('viewBox');
    		// remove min-x
    		params = params.substring(params.indexOf(' ') + 1, params.length);
    		// remove min-y
    		params = params.substring(params.indexOf(' ') + 1, params.length);
    		// get width
    		return parseInt(params.substring(0, params.indexOf(' ')));
    	}
    },
    
    // gets the height of the SVG according to its viewBox (if it exists)
    getViewBoxHeight: function() {
    	// if there is no viewBox yet, just return the size of the container
    	if ($(this.el)[0].getAttribute('viewBox') == undefined) {
    		return $('#content').height();
    	}
    	else {
    		var params = $(this.el)[0].getAttribute('viewBox');
    		// remove min-x
    		params = params.substring(params.indexOf(' ') + 1, params.length);
    		// remove min-y
    		params = params.substring(params.indexOf(' ') + 1, params.length);
    		// remove width, leaving you with height
    		return parseInt(params.substring(params.indexOf(' ') + 1, params.length));
    	}
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
