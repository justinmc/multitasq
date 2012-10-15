// Task Model
var Broccoli_Task = Backbone.Model.extend({
	
	// config, default text in a task
	defaultTitle: 'New Task',

    // default attributes for the task
    defaults: function() {
	  // get current date
	  var date = this.getDateNow();
	  
      return {
        kind: "tasks#task",
        id: '0',				// FIXME you'll have to use the google task api to create a new id
        etag: '0',				// FIXME api
        title: this.defaultTitle,
        updated: date,
        selfLink: '0',			// FIXME api
    	parent: -1,
        position: '0',			// FIXME api
        status: 'needsAction',
        completed: null,
        // not Google Tasks data, only Broccoli
        children: [],
        level: 0,
        dontSync: false,		// dont store if true (pending task)
      };
    },

    // Set any defaults for new entries
    initialize: function(id, title) {
      if (!this.get("title")) {
        this.set({"title": this.defaults.title});
      }
      if (!this.get('dontSync')) {
          this.set({'dontSync': this.defaults.dontSync});
      }
    },

    // Toggle the completed state of the task
    toggleCompleted: function() {
    	if (this.get("completed") == null) {
    		this.setCompleted();
    	}
    	else {
    		this.setIncomplete();
    	}
    },

	// Set the task as completed
	setCompleted: function() {
		var date = this.getDateNow();
		this.save({completed: date});
    	this.save({updated: date});
	},

	// Set the task as incomplete
	setIncomplete: function() {
		var date = this.getDateNow();
		this.save({completed: null});
   		this.save({updated: date});
	},

	// Returns the current date formatted in Google Task's format
	getDateNow: function() {
		var now = new Date;
		var date = now.getUTCFullYear() + '-' + now.getUTCMonth() + '-' + now.getUTCDate() + 'T' + now.getUTCHours() + ':' + now.getUTCMinutes() + ':' + now.getUTCSeconds() + '.000Z';

		return date;
	},

    // Remove this Task from *localStorage* and delete its view.
    clear: function() {
      this.destroy();
    }

});
