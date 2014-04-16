// Basic Archived Task Collection

Multitasq.TaskListArchived = Backbone.Collection.extend({

    // Reference to this collection's model.
    model: Multitasq.Task,
    
    // Save all of the todo items under the `"multitasq"` namespace.
    localStorage: new Backbone.LocalStorage("multitasq-backbone-archived")
});
