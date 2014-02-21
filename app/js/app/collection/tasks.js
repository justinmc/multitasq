// Task Collection

var Multitasq_TaskList = Backbone.Collection.extend({

    // Reference to this collection's model.
    model: Multitasq_Task,
    
    // Url to call to get the task list
    //url: '/js/tasklist_spread.json',

    // Save all of the todo items under the `"multitasq"` namespace.
    localStorage: new Backbone.LocalStorage("multitasq-backbone"),
    
    // Topmost node in the collection
    top: null,
    
    initialize: function(sandbox) {
	    // Each time something gets changed, sync with localstorage
	    this.bind('reset', function() {
	    	this.collectionUpdated(sandbox);
	    });
	    this.bind('add', function() {
	    	this.collectionUpdated(sandbox);
	    });
	    
	    // Sync parent data and localstorage on remove (don't update view automatically though!)
	    this.bind('remove', function(task) {
	   		// remove from parent's "children" data!
			var parent = this.get(task.get('parent'));
			if (parent != undefined) {
				var siblings = parent.get('children');
				siblings.splice($.inArray(task.get('id'), siblings), 1);
				parent.save({'children': siblings});
			}
			
	    	// delete from localstorage
			Backbone.sync('delete', task, {
				success: function() {return;},
				error: function() {return;}
			});
	    });
	},
	
	// Sync the data and the UI
	collectionUpdated: function(sandbox) {
		// reset anything that will be recalculated here
		this.top = null;

	    // if the collection is empty, initialize it with a cool starter!
		if (!this.length) {
			this.create({
				'id': this.newId(),
				'title': 'Conquer the world'
			});
		}
	    
		// update data
		var tasks = this;
		var orphans = [];
		this.each(function(obj, key) {
			// set level
			var parent = tasks.get(obj.get('parent'));
			var level = ((parent == undefined) || (parent == -1)) ? 0 : (parent.get('level') + 1);
			obj.save({'level': level});
			
			// add to parentless if it has no parent
			if ((parent == undefined) || (parent == -1)) {
				orphans.push(obj.get("id"));
			}

			// if it has no parent or is upped, it could be the top node
			if ((orphans.indexOf(obj.get("id")) != -1) || (obj.get("upped"))) {
				// if it's lower level than the current parent, set as top
				var parentLevel = (tasks.top == null) ? -Infinity : tasks.get(tasks.top).get("level");
				if (obj.get('level') > parentLevel) {
					tasks.top = obj.get('id');
				}
			}
			
			// set children for parent if there is a parent
			if ((parent != undefined) && (parent != -1)) {
				var siblings = parent.get('children');
				var id = obj.get('id');
				if ($.inArray(obj.get('id'), siblings) == -1) {
					siblings.push(obj.get('id'));
					parent.save({'children': siblings});
				}
			}
		});
		
		// if there are multiple top level nodes, create one parent for them all
		if (orphans.length > 1) {
			var id = this.newId();
		
			for (var i in orphans) {
				this.get(orphans[i]).save({'parent': id});
			}
		
			this.top = id;
			this.create({
				'id': 		id,
				'parent':	-1,
				'title': 'Conquer the world'
			});
		}
		
		// update the view if what we created is valid
		if (this.isValidTree()) {
			sandbox.render();
		}
		// otherwise, clear all data
		else {
			alert("Error: Invalid data in localstorage, click OK to clear");
			localStorage.clear(); // FIXME better way to do this using backbone sync?
			this.reset();
		}
	},

	// Returns true if the collection is a valid tree, false otherwise
	// FIXME can't return false within loop, have to use this "valid" variable???
	isValidTree: function() {
		var valid = true;
		
		// make sure we have a top node
		if (this.top == null) {
			valid = false
		}
		
		// check that all children ids exist
		var tasks = this;
		this.each(function(obj, key) {
			var children = obj.get('children');
			for (var i in children) {
				if (tasks.get(children[i]) == undefined) {
					valid = false;
				}
			}
		});

		return valid;
	},
	
	// Returns a unique id not currently in the collection that can be used to add a task
	newId: function() {
		var taskNewestId = this.length ? parseInt(this.get(this.at(this.length - 1)).get('id')) : 0;

		var id = taskNewestId + 1;
		var exists = true;
		while (exists) {
			if (!this.get(id)) {
				exists = false;
			}
			id++;
		}
		
		return id;
	},
	
	// Remove the task and all tasks below it, depth first recursively
	removeSubtree: function(task, sandbox) {
		// Call helper fn to actually remove the tasks recursively
		this.removeSubtreeRecurse(task);

		// Update the view
    	this.collectionUpdated(sandbox);		
	},
	
	// Helper fn to removeSubtree, so that we can update the data afterwards
	// Note this is necessary for removing, but not for below changing complete status
	removeSubtreeRecurse: function(task) {
		// recursively remove all children (if any)
		var children = task.get('children');
		while(children.length > 0) {
			var child = this.get(children[0]);
			this.removeSubtreeRecurse(child);
		}
		
		// after the children are gone, remove the task itself
		this.remove(task);
	},
	
	// Mark the task and all below it finished, depth first recursively
	setIncompleteSubtree: function(task) {
		// recursively mark children finished
		var children = task.get('children');
		for (var i = 0; i < children.length; i++) {
			var child = this.get(children[i]);
			this.setIncompleteSubtree(child);
		}					
		
		// after the children are set, set the task itself as finished
		task.setIncomplete();
	},

	// Mark the task and all below it finished, depth first recursively
	setCompletedSubtree: function(task) {
		// recursively mark children finished
		var children = task.get('children');
		for (var i = 0; i < children.length; i++) {
			var child = this.get(children[i]);
			this.setCompletedSubtree(child);
		}					
		
		// after the children are gone, set the task itself as finished
		task.setCompleted();
	},
	
    // Return all items at the given level (distance from root)
    getAtLevel: function(level) {
		var collection = this;
		var atLevel = [];
		
		this.each(function(obj, key) {
			if (collection.getLevel(obj) == level) {
				atLevel.push(obj);
			}
		});
		
		return atLevel;
	},

	// Return the parent node of a given node
	getParent: function(node) {
		return this.get(node.get('parent'));
	},
	
	// Recursively calculate the level (how far below the root node) of the given node 
	getLevel: function(node) {
		// base case
		if ((node.get('parent') == -1) || (node.get('parent') == undefined)) {
			return 0;
		}
		
		// recurse up one level
		return (this.getLevel(this.getParent(node)) + 1);
	},
	
	// Recursively calculates how many levels exist directly below a given node (how many levels of children it has)
	// Does not count minimized nodes
	getHeight: function(node) {
		var children = node.get('children');
		
		// base case
		if ((children.length == 0) || (node.get('minimized') == true)) {
			return 0;
		}
		
		// find height of highest child
		var highest = 0;
		for (i in children) {
			var height = this.getHeight(this.get(children[i]));
			
			if (height > highest) {
				highest = height;
			}
		}
		
		// this node's height is highest child + 1
		return (highest + 1);
	},
	
	// Given two related nodes, returns their nearest common ancestor
	getNearestCommonAncestor: function(nodeA, nodeB) {
		var levelA = nodeA.get('level');
		var levelB = nodeB.get('level');
		
		// base case: nodes are the same node
		if (nodeA.get('id') == nodeB.get('id')) {
			return nodeA;
		}		
		
		// if nodes aren't at same level, recurse with lower one's parent
		if (levelA != levelB) {
			if (levelA > levelB) {
				return this.getNearestCommonAncestor(nodeA, this.get(nodeB.get('parent')));
			}
		}
		
		// recurse with each node's parent
		return this.getNearestCommonAncestor(this.get(nodeA.get('parent')), this.get(nodeB.get('parent')));		
	}
});
