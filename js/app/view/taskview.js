// An individual task in the svg
var Broccoli_Taskview = Backbone.View.extend({

	// The SVG element
	el: $(".content_tasksvg_task"),
	
	// config
   	taskWidth: 150,
   	taskHeight: 60,
   	taskSpacing: 20,
   	mousestopTimer: null,

   	// init
	taskCount: 0,
	nearest: -1,
	cursorIn: 0,	// FIXME problem if mouse starts in svg?
	cursorInTask: 0, // flag for when the mouse is in a task
	
	events: {
	  'click .content_tasksvg_task_close':					'clickRemove',
	  'click .content_tasksvg_task_text':					'clickTitle',
	  'click .content_tasksvg_task_textfield_submit':	'clickSubmit'
	},
	
	initialize: function(nodes) {

	},
	
	/*** Event Functions  ***/
	
	// X button click to delete
	clickRemove: function(e) {
		var task = this.tasks.get($(e.target).parent().data('task'));

		this.tasks.removeSubtree(task);
		
		// remove pending task
		//removeTask($('.pending').data('task'));
		// remove clicked task's whole subtree
		//removeSubtree($(this).parent().data('task'));
	},
	
	// Handler for clicking the title in a task
	clickTitle: function(e) {
		var id = $(e.target).parent().data('task');
		this.editTask(id);
	},
	
	// Handler for clicking the title edit submit button
	clickSubmit: function(e) {
		var id = $(e.target).parent().parent().data('task');
		this.editTaskConfirm(id);
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
		// create the text input field
		var fieldBodyInput = document.createElement('input');
		fieldBodyInput.setAttribute('type', 'text');
		fieldBodyInput.setAttribute('value', text);
		// create the submit button
		var fieldBodySubmit = document.createElement('input');
		fieldBodySubmit.setAttribute('type', 'submit');
		fieldBodySubmit.setAttribute('value', 'Edit');
		fieldBodySubmit.setAttribute('class', 'content_tasksvg_task_textfield_submit');
		
		// stick everything together and put it in the DOM
		fieldBody.appendChild(fieldBodyInput);
		fieldBody.appendChild(fieldBodySubmit);
		field.appendChild(fieldBody);
		label.parent().append(field);
		
		// FIXME put the focus in the new input
		var input = $('.content_tasksvg_task_textfield task'+label.parent().data('task')).children('body').children('input[type=text]').get(0);
//		input.focus();
	},
	
	editTaskConfirm: function(id) {
		var textfield = $('.content_tasksvg_task_textfield.task' + id);
		var input = textfield.find('input[type=text]');
		var task = this.tasks.get(id);
		
		// remove the textfield
		$(textfield).remove();
		
		// write the update and refresh the view
		task.set('title', $(input).attr('value'));
		this.tasks.collectionUpdated(this);
	},
	
    // clear the view and render everything in this.tasks
	render: function(task) {
		this.clear();

		// loop through and add each task
		var sandbox = this;


			var id = task.get('id');
	    	var parent = task.get('parent') ? task.get('parent') : -1;
		    var pending = task.get('dontSync') ? true : false;
		    var text = task.get('title');
	    	
	    	// Can't have more than one pending task!
	    	//if ($('.pending').length && pending) {
	    	//	return;
	    	//}
	    	
	    	var x = ($("#content").width() / 2);
	    	var y = 0;
	    	var level = 0;
	
			// if we're not adding the very first task
	    	if (parent != -1) {
	    		y = parseInt($(".content_tasksvg_task_box.task"+parent).attr("y")) + 100;
	    		
	    		level = parseInt(sandbox.tasks.get(parent).get('level')) + 1; //parseInt($(".content_tasksvg_task.task"+parent).data('level')) + 1;
	    		
	        	// add the task we're creating to its parent's children
	        	//$(".content_tasksvg_task.task"+parent).data('children').push(id);
	    	}
	
			// create the group for the whole task
	    	var group = document.createElementNS('http://www.w3.org/2000/svg','g');
	    	var pendingClass = pending ? ' pending' : '';
	    	group.setAttribute('class', ('content_tasksvg_task task'+id+pendingClass));
	
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
	    	$("#content_tasksvg").append(group);
	
	    	// set data attributes
	    	$('.content_tasksvg_task.task'+id).data('task', id);
	    	$('.content_tasksvg_task.task'+id).data('parent', parent);
	    	$('.content_tasksvg_task.task'+id).data('children', task.get('children'));
	    	$('.content_tasksvg_task.task'+id).data('level', level);
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
    
    // Math functions
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
    	
    	// if the class already doesn't exist, return false now
		if (index == -1) {
		    return false;
		}
		else {    
		    // string manipulation to remove the class
		    classes = classes.substring(0, index) + classes.substring((index + remove.length), classes.length);
			
		    // set the new string as the object's class
		    $(obj).attr('class', classes);

		    return true;
		}
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
