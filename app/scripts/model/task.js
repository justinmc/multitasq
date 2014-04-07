// Task Model
Multitasq.Task = Backbone.Model.extend({
    
    // config, default text in a task
    defaultTitle: 'New Task',

    // default attributes for the task
    defaults: function() {
      // get current date
      var date = Date.now();
      
      return {
        kind: "tasks#task",
        id: '0',                  // FIXME you'll have to use the google task api to create a new id
        etag: '0',                // FIXME google task api
        title: this.defaultTitle,
        updated: date,
        selfLink: '0',            // FIXME google task api
        parent: -1,
        position: '0',            // FIXME google task api
        status: 'needsAction',
        completed: null,
        // not Google Tasks data, only Multitasq
        created: date,
        description: '',
        children: [],
        level: 0,
        minimized: false,
        upped: false
      };
    },

    // Set any defaults for new entries
    initialize: function(id, title) {
        if (!this.get("title")) {
            this.set({"title": this.defaults.title});
            this.set({"title": this.defaults.parent});
        }

        this.bind('change', this.update);
    },

    // Update the updated field
    update: function() {
        this.save({'updated': Date.now()}, {silent: true});
    },
    
    // Toggle the minimized setting true/false
    toggleMinimized: function() {
        if (this.get("minimized") === false) {
            this.save({minimized: true});
        }
        else {
            this.save({minimized: false});
        }
    },
    
    // Toggle the updown setting true/false
    toggleUpdown: function() {
        if (this.get("upped") === false) {
            this.save({upped: true});
        }
        else {
            this.save({upped: false});
        }
    },

    // Toggle the completed state of the task
    toggleCompleted: function() {
        if (this.get("completed") === null) {
            this.setCompleted();
        }
        else {
            this.setIncomplete();
        }
    },

    // Set the task as completed
    setCompleted: function() {
        var date = Date.now();
        this.save({completed: date});
        this.save({updated: date});
    },

    // Set the task as incomplete
    setIncomplete: function() {
        var date = Date.now();
        this.save({completed: null});
        this.save({updated: date});
    },

    // Returns the given date formatted in Google Task's format
    dateToGoogleTasks: function(date) {
        date = date.getUTCFullYear() + '-' + date.getUTCMonth() + '-' + date.getUTCDate() + 'T' + date.getUTCHours() + ':' + date.getUTCMinutes() + ':' + date.getUTCSeconds() + '.000Z';

        return date;
    },

    // Returns the created date formatted in a nice readable format
    getCreatedHuman: function() {
        return this.dateToHuman(this.get('created'));
    },

    // Returns the updated date formatted in a nice readable format
    getUpdatedHuman: function() {
        return this.dateToHuman(this.get('updated'));
    },

    // Converts the given date string to a human readable format
    dateToHuman: function(dateString) {
        var date = new Date(dateString);

        // Check for an invalid date
        if (Object.prototype.toString.call(date) === '[object Date]' && isNaN(date.valueOf())) {
            return '';
        }

        return date.toLocaleTimeString() + ' ' + date.toLocaleDateString();
    },

    // Remove this task from localStorage and delete its view.
    clear: function() {
      this.destroy();
    }
});
