// An individual task in the svg
var Multitasq_TaskView = Backbone.View.extend({

	// The SVG element
	el: null,
	
	// the task for this view
	task: null,
	
	// config

   	// init
	
	events: {
	},
	
	// just initializes the variables here, doesn't render
	initialize: function(task) {
		this.task = task;
		this.el = $(".content_tasksvg_task.task" + task.get('id'));
	},
	
	render: function(sandbox) {
		var id = this.task.get('id');
    	var parent = this.task.get('parent');
	    var pending = this.task.get('dontSync') ? true : false;
	    
	    var text = this.task.get('title');
	    
	    // limit the length of the title text
        if (text.length > sandbox.taskTitleLength) {
        	text = text.substring(0, (sandbox.taskTitleLength - 1));
        	text = text + "...";
        }

		var opacity = this.task.get('completed') ? 0.3 : 1;
    	
    	var x = (sandbox.getViewBoxWidth() / 2 - sandbox.taskWidth / 2);
    	var y = 4;
    	var level = 0;

		// if we're not adding the very first task
    	if ((parent != -1) && (!this.task.get("upped"))) {
    		y = parseInt($(".content_tasksvg_task_box.task"+parent).attr("y")) + 100;
    		
    		level = parseInt(sandbox.tasks.get(parent).get('level')) + 1;
    	}

		// create the group for the whole task
    	var group = document.createElementNS('http://www.w3.org/2000/svg','g');
    	var pendingClass = pending ? ' pending' : '';
    	group.setAttribute('class', ('content_tasksvg_task task'+id+pendingClass));
		group.setAttribute('style', 'opacity: ' + opacity + ';');

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
        taskText.setAttribute('textLength', 0);
        var textNode = document.createTextNode(text);
		taskText.appendChild(textNode);
		group.appendChild(taskText);
        
        // create the title text via foreignobject
        /*
		var title = document.createElementNS('http://www.w3.org/2000/svg','foreignObject');
		title.setAttribute('class', ('content_tasksvg_task_text task'+id));
        title.setAttribute('x', (x + 5));
        title.setAttribute('y', (y + 10));
        title.setAttribute('height', 40);
        title.setAttribute('width', sandbox.taskWidth - 10);
		// and create its body
		var titleBody = document.createElement('body');
		titleBody.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
		// and put a p tag in there
		var titleBodyP = document.createElement('p');
		titleBodyP.setAttribute('style', 'color: #cfcfcf;');
		titleBodyP.innerHTML = this.task.get('title');
		// and append everything
		titleBody.appendChild(titleBodyP);
        title.appendChild(titleBody);
        group.appendChild(title);
        */
        
        // create the up/down arrrow button if not the absolute top node
		if (parent != -1) {
	        var updown = document.createElementNS('http://www.w3.org/2000/svg','text');
        	updown.setAttribute('class', ('content_tasksvg_task_updown task'+id));
    	    updown.setAttribute('x', (x + sandbox.taskWidth - 54));
	        updown.setAttribute('y', (y + 16));
        	updown.setAttribute('textLength', 0);
    	    var updownText = document.createTextNode((this.task.get("id") == sandbox.tasks.top) ? '↓' : '↑');
	        updown.appendChild(updownText);
        	group.appendChild(updown);
		}
                
        // create the -/+ minimize button
        var minimize = document.createElementNS('http://www.w3.org/2000/svg','text');
        minimize.setAttribute('class', ('content_tasksvg_task_minimize task'+id));
        minimize.setAttribute('x', (x + sandbox.taskWidth - 36));
        minimize.setAttribute('y', (y + 16));
        minimize.setAttribute('textLength', 0);
        var minimizeText = document.createTextNode(this.task.get("minimized") ? '+' : '-');
        minimize.appendChild(minimizeText);
        group.appendChild(minimize);
        
        // create the X close button
        var close = document.createElementNS('http://www.w3.org/2000/svg','text');
        close.setAttribute('class', ('content_tasksvg_task_close task'+id));
        close.setAttribute('x', (x + sandbox.taskWidth - 16));
        close.setAttribute('y', (y + 16));
        close.setAttribute('textLength', 20);
        var closeText = document.createTextNode('X');
        close.appendChild(closeText);
        group.appendChild(close);
        
        // create the connector to its parent (if it has one)
        if ((parent != -1) && (!this.task.get("upped"))) {
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
    	$('.content_tasksvg_task.task'+id).data('children', this.task.get('minimized') ? [] : this.task.get('children'));
    	$('.content_tasksvg_task.task'+id).data('level', level);
	}
});
