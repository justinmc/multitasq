/* Author: Justin McCandless
 * 
 * 
 * steps to alpha 2:
 * 	read data from json object ala google tasks
 * 	on every(?) step: update data and re-render
 * 
 * backbone:
 * 	write to localstorage
 * 
 * nearestSpace functionality
 * 
 * get focus on click to edit!
 * 
 * zoom: tougher than I thought...
 * probably post on stackoverflow
 * transform: scale works on divs and stuff, and on the svg itself, but not on the rects
 * other non-css scaling methods in svg?
 * would viewbox allow me to properly scale stuff within the svg?
 * 
*/

function taskmap(nodes) {
	
	/*** Constructor ***/
	
	// config
   	var taskWidth = 150;
   	var taskHeight = 60;
   	var taskSpacing = 20;

   	// init
	var taskCount = 0;
	var nearest = -1;
	var cursorIn = 0;	// FIXME problem if mouse starts in svg?
	var cursorInTask = 0; // flag for when the mouse is in
	
	// create the tree
	/*nodes.each(function(obj, key) {
    	var parent = obj.get('parent') ? obj.get('parent') : -1;
		addTask(parent, obj.get('title'), false, obj.get('id'));
	});*/
	
	// watch functions
	$(".content_tasksvg_task").live('mouseenter', function(e) {
		cursorInTask = 1;
	});
	$(".content_tasksvg_task").live('mouseleave', function(e) {
		cursorInTask = 0;
	});
	$("#content_tasksvg").live('mouseenter', function(e) {
		cursorIn = 1;
		if (1) {
			nearest = nearestTask((e.pageX - $(this).offset().left), (e.pageY - $(this).offset().top));
			var task = new Broccoli_Task({
				'id': taskCount,
				'parent': nearest
			});
			nodes.add(task);
			//addTask(nearest, "New Task", true, taskCount);
		}
	});
	$("#content_tasksvg").live('mouseleave', function(e) {
		cursorIn = 0;
		// remove pending task(s)
		$('.content_tasksvg_task.pending').each( function() {
			removeTask($(this).data('task'));
		})
	});
	$("#content_tasksvg").mousemove(function(e){
		if (cursorIn && !cursorInTask) {
			var nearestNew = nearestTaskAbove((e.pageX - $(this).offset().left), (e.pageY - $(this).offset().top));
			
			// if the nearest task has changed
			if (nearestNew != nearest) {
				// remove the old pending task
				$('.content_tasksvg_task.pending').each( function() {
					removeTask($(this).data('task'));
				})
				
				// add a new pending task at the new location
				addTask(nearestNew, "New Task", true, taskCount);
				
				// and update nearest
				nearest = nearestNew;
			}
		}
	});
	// click anywhere
	$('#content_tasksvg_bg').click(function(e) {
		// if a task is being edited, confirm the edit
		if ($('.content_tasksvg_task_textfield').length) {
			$('.content_tasksvg_task_textfield').each(function() {
				editTask($(this).parents('g').data('task'));
			});
		}
		else {
			// create the pending task and add another pending task
			removeClassSVG($('.content_tasksvg_task.pending'), 'pending');
			addTask(nearestTask((e.pageX - $(this).offset().left), (e.pageY - $(this).offset().top)), "New Task", true, taskCount);
		}
	});
	// X button
	$(".content_tasksvg_task_close").live('click', function() {
		// remove pending task
		removeTask($('.pending').data('task'));
		// remove clicked task's whole subtree
		removeSubtree($(this).parent().data('task'));
	});
	// click to edit task text
	$('.content_tasksvg_task_text').live('click', function() {
		// if we're editing a pending task, make it real first
		if (hasClassSVG($(this).parent(), 'pending')) {
			removeClassSVG($('.content_tasksvg_task.pending'), 'pending');
		}
		
		// save the current text and remove it in the svg
		var text = $(this).get(0).textContent;
		$(this).get(0).textContent = '';
		
		// create foreign object in svg
		var field = document.createElementNS('http://www.w3.org/2000/svg','foreignObject');
		field.setAttribute('class', 'content_tasksvg_task_textfield task'+$(this).parent().data('task'));
		field.setAttribute('x', $(this).attr('x'));
		field.setAttribute('y', ($(this).attr('y') - 20));
		field.setAttribute('width', (taskWidth - 10));
		field.setAttribute('height', '50');
		// and create its body
		var fieldBody = document.createElement('body');
		fieldBody.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
		// create the text input field
		var fieldBodyInput = document.createElement('input');
		fieldBodyInput.setAttribute('type', 'text');
		fieldBodyInput.setAttribute('value', text);
		// create the submit button
		var fieldBodySubmit = document.createElement('input');
		fieldBodySubmit.setAttribute('type', 'submit');
		fieldBodySubmit.setAttribute('value', 'Edit');
		fieldBodySubmit.setAttribute('onClick', 'editTask('+$(this).parent().data('task')+')');
		
		// stick everything together and put it in the DOM
		fieldBody.appendChild(fieldBodyInput);
		fieldBody.appendChild(fieldBodySubmit);
		field.appendChild(fieldBody);
		$(this).parent().append(field);
		
		// FIXME put the focus in the new input
		var input = $('.content_tasksvg_task_textfield task'+$(this).parent().data('task')).children('body').children('input[type=text]').get(0);
//		input.focus();
	});
	
	/*** End Constructor ***/
	
    function addTask(parent, text, pending, id)
    {
    	// default
    	parent = typeof parent !== 'undefined' ? parent : -1;
    	
    	// Can't have more than one pending task!
    	if ($('.pending').length && pending) {
    		return;
    	}
    	
    	var x = ($("#content").width() / 2);
    	var y = 0;
    	var level = 0;

		// if we're not adding the very first task
    	if (parent != -1) {
    		y = parseInt($(".content_tasksvg_task_box.task"+parent).attr("y")) + 100;
    		
    		level = parseInt($(".content_tasksvg_task.task"+parent).data('level')) + 1;
    		
        	// add the task we're creating to its parent's children
        	$(".content_tasksvg_task.task"+parent).data('children').push(id);
    	}
    	
    	var group = document.createElementNS('http://www.w3.org/2000/svg','g');
    	var pendingClass = pending ? ' pending' : '';
    	group.setAttribute('class', ('content_tasksvg_task task'+id+pendingClass));

    	var task = document.createElementNS('http://www.w3.org/2000/svg','rect');
    	task.setAttribute('class', ('content_tasksvg_task_box task'+id));
    	task.setAttribute('x', x);
    	task.setAttribute('y', y);
    	task.setAttribute('rx', '10');
    	task.setAttribute('ry', '10');
    	task.setAttribute('width', taskWidth);
    	task.setAttribute('height', taskHeight);
    	group.appendChild(task);
        
        var taskText = document.createElementNS('http://www.w3.org/2000/svg','text');
        taskText.setAttribute('class', ('content_tasksvg_task_text task'+id));
        taskText.setAttribute('x', (x + 5));
        taskText.setAttribute('y', (y + 40));
        taskText.setAttribute('textLength', taskWidth);
    	var textNode = document.createTextNode(text);
        taskText.appendChild(textNode);
        group.appendChild(taskText);
        
        var close = document.createElementNS('http://www.w3.org/2000/svg','text');
        close.setAttribute('class', ('content_tasksvg_task_close task'+id));
        close.setAttribute('x', (x + taskWidth - 16));
        close.setAttribute('y', (y + 16));
        close.setAttribute('textLength', 20);
        var closeText = document.createTextNode('X');
        close.appendChild(closeText);
        group.appendChild(close);
        
        if (parent != -1) {
	    	var connect = document.createElementNS('http://www.w3.org/2000/svg','line');
	    	connect.setAttribute('class', 'content_tasksvg_connector task'+parent+' task'+id);
	    	connect.setAttribute('x1', getTaskMidX(parent));
	    	connect.setAttribute('y1', getTaskMidBotY(parent));
	    	connect.setAttribute('x2', (x + (taskWidth / 2)));
	    	connect.setAttribute('y2', y);
    	group.appendChild(connect);
        }

    	$("#content_tasksvg").append(group);

    	// set data
    	$('.content_tasksvg_task.task'+id).data('task', id);
    	$('.content_tasksvg_task.task'+id).data('parent', parent);
    	$('.content_tasksvg_task.task'+id).data('children', []);
    	$('.content_tasksvg_task.task'+id).data('level', level);
    	
    	taskCount++;
    	
    	// reposition this task and all it affects
    	if (parent != -1) {
    		restructureTree(parent);
    	}
    }
    
    // remove a task
    function removeTask(which) {
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
    		restructureTree(parent);
    	}
    }
    // recursively remove an entire subtree bottom up
    function removeSubtree(top) {
    	var children =  $(".content_tasksvg_task.task"+top).data("children");
    	
    	var numChildren = children.length;
		for (var i = 0; i < numChildren; i++) {
			removeSubtree(children[i]);
		}
		removeTask(top);
		return;
    }
    
    // Changes a task's text and removes the inputs
    function editTask(which) {
		$('.content_tasksvg_task_text.task'+which).get(0).textContent = $('.content_tasksvg_task_textfield>body>input[type=text]').attr('value');
		$('.content_tasksvg_task_textfield').remove();
	}
    
    // reposition all nodes, and spread out if necessary to prevent overlap
    function restructureTree(top, spacing) {
		spacing = (spacing == undefined) ? taskSpacing : spacing; // spacing between tasks

    	// if nodes are overlapping, we need to spread out top's level
    	var overlap = restructureTreePosition(top, spacing);
    	
    	//alert("restructured " + top + ' with spacing ' + spacing);
		while (overlap) {
			var level = nodes.getLevel(nodes.get(top));
			overlap = restructureTreePosition($(".content_tasksvg_task.task"+top).data("parent"), (getSpacingAt(level) + taskWidth / 2 + taskSpacing));
		}
    }
    
    // recursively repositions all nodes below the given node, at the given spacing
    function restructureTreePosition(top, spacing) {
    	var children =  $(".content_tasksvg_task.task"+top).data("children");

    	var numChildren = children.length;
		for (var i = 0; i < numChildren; i++) {
			 // left or right of center?
			var sign = (i < Math.floor(children.length / 2)) ? -1 : 1;
			
			// calculate the offset based on distance from center nodes
			var offset = sign * (taskWidth + spacing) * Math.floor(Math.abs(i -((children.length - 1) / 2)));
			
			// if there are an odd # of children, not centered, a offset by half
			if (children.length % 2 == 0) {
				offset = offset + (sign * (taskWidth / 2 + spacing / 2));
			}
			
			var position = (parseInt($(".content_tasksvg_task_box.task"+top).attr("x")) + offset);
			
			// reposition this child
			moveTaskTo(children[i], position);
			
			// and recursively restructure all of this child's children, if it has any
			var overlap;
			if ($(".content_tasksvg_task.task"+children[i]).data('children').length > 0) {
				overlap = restructureTreePosition(children[i], taskSpacing);
			}
		}

		var level = nodes.getLevel(nodes.get(top)) + 1;
		
		return (overlap || isOverlap(level));
	}
    
    // returns true if nodes visually overlap on the given, false otherwise
    function isOverlap(level) {
    	// get all nodes on this level
    	var bb_atlevel = nodes.getAtLevel(level);
    	
    	var taken = [];
    	for (i in bb_atlevel) {
    		var start = parseInt($(".content_tasksvg_task_box.task"+bb_atlevel[i].get('id')).attr("x"));
    		var takenTask = [start, (start + taskWidth + taskSpacing)];
    		
    		for (j in taken) {
    			// beginning in a taken range
    			if ((takenTask[0] >= taken[j][0]) && ((takenTask[0] < taken[j][1]))) {
    				return true;
    			}
    			// end in a taken range
    			if ((takenTask[1] > taken[j][0]) && ((takenTask[1] <= taken[j][1]))) {
    				return true;
    			}
    		}
    		
    		taken.push(takenTask);
    	}
    	
    	return false;
    }
    
    // Returns the amount of spacing between elements in a given level
    function getSpacingAt(level) {
    	// get all nodes on this level
    	var bb_atlevel = nodes.getAtLevel(level);
    	
    	// find a pair of siblings
    	var siblings = [];
    	var i = 0;
    	while ((siblings.length < 2) && bb_atlevel.length) {
    		var parent = bb_atlevel[i].get('parent');
    		siblings =  $(".content_tasksvg_task.task"+parent).data("children");

    		i++;
    		
    		// if there are no siblings, then spacing must be normal
    		if ((i >= bb_atlevel.length) && (siblings.length < 2)) {
    			return taskSpacing;
    		}
    	}
    	
    	var sib1x = $(".content_tasksvg_task_box.task"+siblings[0]).attr('x');
    	var sib2x = $(".content_tasksvg_task_box.task"+siblings[1]).attr('x');
    	return (Math.abs(sib1x - sib2x) - taskWidth);
    }
    
    function getTaskMidX(which)
    {
    	if (which == -1) {
    		return 0;
    	}
    	else {
    		return parseInt($(".content_tasksvg_task_box.task"+which).attr('x')) + (parseInt($(".content_tasksvg_task_box.task"+which).attr('width')) / 2);
    	}
    }
    function getTaskMidBotY(which)
    {
    	if (which == -1) {
			return 0;
		}
		else {
			return parseInt($(".content_tasksvg_task_box.task"+which).attr('y')) + parseInt($(".content_tasksvg_task_box.task"+which).attr('height'));
		}
    }
    function getTaskMidTopY(which)
    {
    	return parseInt($(".content_tasksvg_task_box.task"+which).attr('y'));
    }
    
    // moves given task's rect, text, and connectors to given X coordinate
    function moveTaskTo(which, where) {
    	$(".content_tasksvg_task_box.task"+which).get(0).setAttribute('x', where);
    	$(".content_tasksvg_task_text.task"+which).get(0).setAttribute('x', (where + 5));
    	$(".content_tasksvg_task_close.task"+which).get(0).setAttribute('x', (where + taskWidth - 16));
    	// move connector based on parent's position
    	var parentPos = parseInt($('.content_tasksvg_task_box.task'+$('.content_tasksvg_task.task'+which).data('parent')).attr('x'));
    	$(".content_tasksvg_connector.task"+which).get(0).setAttribute('x1', (parentPos + (taskWidth / 2)));
    	$(".content_tasksvg_connector.task"+which).get(0).setAttribute('x2', (where + (taskWidth / 2)));
    	// move the edit textfield if it's open
    	if ($('.content_tasksvg_task_textfield.task'+which).length) {
    		$('.content_tasksvg_task_textfield.task'+which).get(0).setAttribute('x', (where + 5));
    	}
    }
    // returns the number of the non-pending task nearest the given coordinates
    function nearestTask (x, y) {
//    	console.log("what is the task nearest "+x+","+y+"?");
    	var nearestTask;
    	var nearestDistance = 100000;	// a number bigger than any monitor
    	$('.content_tasksvg_task:not(.pending) > .content_tasksvg_task_box').each( function() {
//    		console.log("    is it task"+$(this).parent().data('task')+" at "+$(this).attr('x')+","+$(this).attr('y')+"?");
    		// calculate distance from each task's bottom middle
    		var taskX = parseInt($(this).attr('x')) + (taskWidth / 2);
    		var taskY = parseInt($(this).attr('y')) + taskHeight;
    		var currentDistance = distance(taskX, taskY, x, y);
    		if (currentDistance < nearestDistance) {
    			nearestDistance = currentDistance;
    			nearestTask = $(this).parent().data('task');
    		}
    	});
//    	console.log("    It was "+nearestTask);
		return nearestTask;
    }
    // returns the number of the non-pending task nearest and above the given coordinates
    // FIXME this needs to also get us the correct position among the children.  The nearest space
    function nearestTaskAbove (x, y) {
    	var nearestTask;
    	var nearestDistance = 100000;	// a number bigger than any monitor
    	$('.content_tasksvg_task:not(.pending) > .content_tasksvg_task_box').each( function() {
    		// calculate distance from each task's bottom middle
    		var taskX = parseInt($(this).attr('x')) + (taskWidth / 2);
    		var taskY = parseInt($(this).attr('y')) + taskHeight;
    		var currentDistance = distance(taskX, taskY, x, y);
    		if ((currentDistance < nearestDistance) && (y > taskY)) {
    			nearestDistance = currentDistance;
    			nearestTask = $(this).parent().data('task');
    		}
    	});
    	if (nearestTask == undefined) {
    		nearestTask = 'MTMyNDU1NTY5OTc0MTIwMTM1MjI6MDoxNzE4MjE1Mzkz';
    	}
		return nearestTask;
    }
    // returns the number of the pending task
    function getPending() {
    	
    }
    
    // distance between two points!
    function distance (x1, y1, x2, y2) {
    	return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
    }

    // jQuery's removeClass doesn't work for SVG, but this does!
    function removeClassSVG(obj, remove) {
    	var classes = $(obj).attr('class');
    	var index = classes.search(remove);
    	
    	// string manipulation to remove the class
    	classes = classes.substring(0, index) + classes.substring((index + remove.length), classes.length);
    	
    	// set the new string as the object's class
    	$(obj).attr('class', classes);
    }
    // jQuery's hasClass doesn't work for SVG, but this does!
    function hasClassSVG(obj, has) {
    	var classes = $(obj).attr('class');
    	var index = classes.search(has);
    	
    	if (index == -1) {
    		return false;
    	}
    	else {
    		return true;
    	}
    }
}
