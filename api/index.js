const { app } = require('@azure/functions');
const { ObjectId } = require('mongodb');
const mongoClient = require("mongodb").MongoClient;

// helper function, takes in list of todos and sorts by time in descending order (so by most recent)
function sortRecent(todolist){

  // when the return is negative, it puts a first, and when the return is positive it puts b first
  // so for example if the timeadded for a is smaller than the time added for b (so before) then b will be put
  // first on the sorted list
  let sortedTodos = todolist.sort((a, b) =>{
    return new Date(b.timeadded) - new Date(a.timeadded)
  })

  return sortedTodos
}

// dummy function for testing api calls 
app.http('dummyFunction', {
  methods: ['GET'], 
  authLevel: 'anonymous',
  route: 'try',
  handler: async (request, context) => {
    console.log("hit this")
    return{
      status: 200, 
      jsonBody: {answer: "OK cool"}
    }
  }

})
// this endpoint is used both for todos and /done
// might change later to split into 2, 1 endpoint for each based on completion status
// so the filtering is done in the backend
// OK this should be changed to only get items marked incomplete
app.http('getTodos', {
    methods: ['GET'], 
    authLevel: 'anonymous',
    route: 'todos',
    handler: async (request, context) => {
      context.log("In get todos /api/todos")

      // learned how to decode into client principal from https://learn.microsoft.com/en-us/azure/static-web-apps/user-information?tabs=javascript
      // will use the "userId" field to filter
      // all todos/categories have a user id associated with them based on who made it, user id is permanent for any account made
      const header = request.headers.get('x-ms-client-principal');
      const encoded = Buffer.from(header, 'base64');
      const decoded = encoded.toString('ascii');
      let clientPrincipal = JSON.parse(decoded);
      let user_id;
      
      if(clientPrincipal && clientPrincipal["userRoles"].includes('anonymous') && clientPrincipal["userRoles"].includes("authenticated")){
        user_id = clientPrincipal["userId"]
      }

      // trying to access while not authenticated
      else{
        context.log("Invalid User Case")
        return{
          status: 404, 
          body: "Invalid user"
        }
      }



      // do a lookup on the data storage and get all un-completed todos
      const client = await mongoClient.connect(process.env.AZURE_MONGO_DB)
      let todos = await client.db("todo_hw").collection("todos").find({completed: false, user_id: user_id}).toArray()
      // sort by most recent
      todos = sortRecent(todos)

      client.close();
      context.log("finished query")
      return {
          headers:{
              'Content-Type': 'application/json'
          },
          jsonBody: {data: todos}
      }
    },
});


// add endpoint for getting specific todo item
app.http('getTodo', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'todo/{id}',
  handler: async (request, context) => {

    const header = request.headers.get('x-ms-client-principal');
    const encoded = Buffer.from(header, 'base64');
    const decoded = encoded.toString('ascii');
    let clientPrincipal = JSON.parse(decoded);
    let user_id;
    
    if(clientPrincipal && clientPrincipal["userRoles"].includes('anonymous') && clientPrincipal["userRoles"].includes("authenticated")){
      user_id = clientPrincipal["userId"]
    }

    // trying to access this while not authenticated
    else{
      return{
        status: 404, 
        body: "Invalid user"
      }
    }

      const id = request.params.id;
      

      let category_name = ""
      const client = await mongoClient.connect(process.env.AZURE_MONGO_DB)


      // prevent 500 errors
      if(!ObjectId.isValid(id)){
          console.log("Wrong")
          return {
            status:404,
            jsonBody: {error: "Invalid ID"}
        }
      }


      // only get uncompleted todos, trying to access this for done todos is prohibited
      let the_todo = await client.db("todo_hw").collection("todos").find({_id: new ObjectId(id), completed: false, user_id: user_id}).toArray()
      
      
      if(the_todo.length > 0 && the_todo[0]._category){
        category_name = await client.db("todo_hw").collection("categories").find({_id: the_todo[0]._category}).toArray()
        if(category_name.length > 0){
          category_name = category_name[0].name
          the_todo[0]["category_name"] = category_name
        }
      }
      client.close();


      if(the_todo.length < 1){
          return {
            status:404,
            jsonBody: {error: "No todo found by that Id"}
        }
      }

      else if (the_todo.length > 0) {
          return {
              jsonBody: {todo: the_todo[0]}
          }
      }
      
  },
});


// add endpoint for adding a todo item
// need to update this for checking if category was specified
app.http('newTodo', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'todos',
  handler: async (request, context) => {


    // learned how to decode into client principal from https://learn.microsoft.com/en-us/azure/static-web-apps/user-information?tabs=javascript
    const header = request.headers.get('x-ms-client-principal');
    const encoded = Buffer.from(header, 'base64');
    const decoded = encoded.toString('ascii');
    let clientPrincipal = JSON.parse(decoded);
    let user_id;
    
    if(clientPrincipal && clientPrincipal["userRoles"].includes('anonymous') && clientPrincipal["userRoles"].includes("authenticated")){
      user_id = clientPrincipal["userId"]
    }

    // making post while not authenticated
    else{
      return{
        status: 404, 
        body: "Invalid user"
      }
    }


    let body = await request.json();

    const client = await mongoClient.connect(process.env.AZURE_MONGO_DB)
    let contents = body._contents;
    let completed = body._completed;

    // also need to add a date (so we can sort by most recent when getting todos)
    let timeadded = new Date()


    // check if category was specified, if so do a lookup and get the ID of the category
    let _category = "n/a"
    let category_name = ""
    if(body.category){
      category_name = body.category
      let category_id = await client.db("todo_hw").collection("categories").find({name: body.category}).toArray()
      if(category_id.length > 0){
        _category = category_id[0]._id
      }
    }
    payload = {contents, completed, _category, timeadded, user_id}
    

    // final server-side validation check, 404 if contents are empty/too long or completed attribute is invalid
    if(contents.length <= 0 || contents.length > 1000 || (body._completed != true && body._completed != false)){
      return{
        status: 404, 
        body: "Input is invalid"
      }
    }

    
    const result = await client.db("todo_hw").collection("todos").insertOne(payload)

    client.close();
    
    return{
      status: 201, /* Defaults to 200 */
      jsonBody: {contents: contents, completed: completed}
  };
  }
})


// endpoint for getting only completed items
app.http('getCompletedTodos', {
  methods: ['GET'], 
  authLevel: 'anonymous',
  route: 'todos/done',
  handler: async (request, context) => {

    const header = request.headers.get('x-ms-client-principal');
    const encoded = Buffer.from(header, 'base64');
    const decoded = encoded.toString('ascii');
    let clientPrincipal = JSON.parse(decoded);
    let user_id;
    
    if(clientPrincipal && clientPrincipal["userRoles"].includes('anonymous') && clientPrincipal["userRoles"].includes("authenticated")){
      user_id = clientPrincipal["userId"]
    }

    // trying to access while not authenticated
    else{
      return{
        status: 404, 
        body: "Invalid user"
      }
    }
    

    // do a lookup on the data storage and get all completed todos
    const client = await mongoClient.connect(process.env.AZURE_MONGO_DB)
    let todos = await client.db("todo_hw").collection("todos").find({completed: true, user_id: user_id}).toArray()
    // sort by most recent
    todos = sortRecent(todos)
    client.close();

    return {
        headers:{
            'Content-Type': 'application/json'
        },
        jsonBody: {data: todos}
    }

  },
});


// update todo item content
app.http('updateContent',{
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'todo/update',
  handler: async (request, context) =>{

    const header = request.headers.get('x-ms-client-principal');
    const encoded = Buffer.from(header, 'base64');
    const decoded = encoded.toString('ascii');
    let clientPrincipal = JSON.parse(decoded);
    let user_id;
    
    if(clientPrincipal && clientPrincipal["userRoles"].includes('anonymous') && clientPrincipal["userRoles"].includes("authenticated")){
      user_id = clientPrincipal["userId"]
    }

    // trying to access while not authenticated
    else{
      return{
        status: 404, 
        body: "Invalid user"
      }
    }


    let body = await request.json();
    let the_id = body.id
    let content = body._content

    if(!the_id || !content || !ObjectId.isValid(the_id)){
      return{
        status: 400, 
        body: "Invalid Update"
      }
    }

    const client = await mongoClient.connect(process.env.AZURE_MONGO_DB)

    // first check if item was already marked complete, just skip this entire thing if so
    let completed = await client.db("todo_hw").collection("todos").find({_id: new ObjectId(the_id)}).toArray()
    if(completed.length > 0){
      if(completed[0]["completed"] != false){
        client.close()
        return{
          status: 400, 
          body: "Invalid Update, Item Already Complete"
        }
      }
    }

    const result = await client.db("todo_hw").collection("todos").updateOne({_id: new ObjectId(the_id)}, {$set: {"contents": content}})
    client.close()

    if (result.matchedCount > 0) {
      return {
          jsonBody: {status: "ok"}
        }
    }     
    
    else{
      return{
        status: 404, 
        body: "Invalid Update"
      }
    }



  }
})

// update todo item category
app.http('updateCategory', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'todos/categoryupdate',
  handler: async (request, context) =>{

    const header = request.headers.get('x-ms-client-principal');
    const encoded = Buffer.from(header, 'base64');
    const decoded = encoded.toString('ascii');
    let clientPrincipal = JSON.parse(decoded);
    let user_id;
    
    if(clientPrincipal && clientPrincipal["userRoles"].includes('anonymous') && clientPrincipal["userRoles"].includes("authenticated")){
      user_id = clientPrincipal["userId"]
    }

    // trying to access while not authenticated
    else{
      return{
        status: 404, 
        body: "Invalid user"
      }
    }


    let body = await request.json();
    let todo_id = body.id
    if(body && body.category && body.id){
      const client = await mongoClient.connect(process.env.AZURE_MONGO_DB)
      // check if item already complete, if so just end it with 400
      let completed = await client.db("todo_hw").collection("todos").find({_id: new ObjectId(todo_id)}).toArray()
      if(completed.length > 0){
        if(completed[0]["completed"] != false){
          client.close()
          return{
            status: 400, 
            body: "Invalid Update, Item Already Complete"
          }
        }
      }

      // this won't return anything in the db, will just update the category of the item to an "n/a" string 
      let result;
      if(body.category == "n/a"){
        result = await client.db("todo_hw").collection("todos").updateOne({_id: todo_id}, {$set: {_category: "n/a"}})
      }
      // first get the category id associated with the name
      else{
        let categ = await client.db("todo_hw").collection("categories").find({name: body.category}).toArray()
      
        if(categ.length > 0){
          categ = categ[0]._id
          // do the update
          result = await client.db("todo_hw").collection("todos").updateOne({_id: todo_id}, {$set: {_category: new ObjectId(categ)}})
        }
      }
      
      if(result.matchedCount > 0){
        return {
          status: 200, 
          body: "Completed Category Update"
        }
      }

      
      client.close()
    }


    return {
      status: 404, 
      body: "Failed to update category"
    }
  },
})

// update todo item completion status
app.http('updateCompletion', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'todos/completionupdate',
  handler: async (request, context) =>{

    const header = request.headers.get('x-ms-client-principal');
    const encoded = Buffer.from(header, 'base64');
    const decoded = encoded.toString('ascii');
    let clientPrincipal = JSON.parse(decoded);
    let user_id;
    
    if(clientPrincipal && clientPrincipal["userRoles"].includes('anonymous') && clientPrincipal["userRoles"].includes("authenticated")){
      user_id = clientPrincipal["userId"]
    }

    // trying to access while not authenticated
    else{
      return{
        status: 404, 
        body: "Invalid user"
      }
    }
    
    let body = await request.json();
    let the_id = body.id
    let completion_status = body._completed

    if(!the_id || (completion_status != true && completion_status != false)|| !ObjectId.isValid(the_id)){
      console.log(the_id)
      console.log(completion_status)
      return{
        status: 404, 
        body: "Invalid Update"
      }
    }

    const client = await mongoClient.connect(process.env.AZURE_MONGO_DB)
    const result = await client.db("todo_hw").collection("todos").updateOne({_id: new ObjectId(the_id)}, {$set: {"completed": completion_status}})
  
    client.close()

    if (result.matchedCount > 0) {
      return {
          jsonBody: {status: "ok"}
        }
    }     
    
    else{
      return{
        status: 404, 
        body: "Invalid Update"
      }
    }
  },

})

// endpoint for getting something based on category
app.http('getTodoCategory', {
  methods: ['GET'], 
  authLevel: 'anonymous',
  route: 'todos/{category}',
  handler: async (request, context) => {

    const header = request.headers.get('x-ms-client-principal');
    const encoded = Buffer.from(header, 'base64');
    const decoded = encoded.toString('ascii');
    let clientPrincipal = JSON.parse(decoded);
    let user_id;
    
    if(clientPrincipal && clientPrincipal["userRoles"].includes('anonymous') && clientPrincipal["userRoles"].includes("authenticated")){
      user_id = clientPrincipal["userId"]
    }

    // trying to access while not authenticated
    else{
      return{
        status: 404, 
        body: "Invalid user"
      }
    }

    const category = request.params.category;
    let category_data = []


    const client = await mongoClient.connect(process.env.AZURE_MONGO_DB)
    const category_id = await client.db("todo_hw").collection("categories").find({name: category, user_id: user_id}).toArray()
  
    if(category_id.length > 0){
      let actual_id = category_id[0]._id
      // prevent 500 errors
      if(!ObjectId.isValid(actual_id)){
        console.log("Wrong")
        return {
          status:404,
          jsonBody: {error: "Invalid ID"}
      }
    }
      let result = await client.db("todo_hw").collection("todos").find({_category: new ObjectId(actual_id), completed: false, user_id: user_id}).toArray()
     
      // sort by most recent
      result = sortRecent(result)
      category_data = result
    }

    else{
      return{
        status: 404, 
        body: "Invalid Category Asked For"
      }
    }
    
    client.close()

    payload = {category_data, category}
        
    return {
        headers:{
            'Content-Type': 'application/json'
        },
        jsonBody: {data: payload}
    }
  },
})


// pretty much identical to above, just the filter becomes completed true instead of completed false
app.http('getDoneCategory', {
  methods: ['GET'], 
  authLevel: 'anonymous',
  route: 'done/{category}',
  handler: async (request, context) =>{
    const header = request.headers.get('x-ms-client-principal');
    const encoded = Buffer.from(header, 'base64');
    const decoded = encoded.toString('ascii');
    let clientPrincipal = JSON.parse(decoded);
    let user_id;
    
    if(clientPrincipal && clientPrincipal["userRoles"].includes('anonymous') && clientPrincipal["userRoles"].includes("authenticated")){
      user_id = clientPrincipal["userId"]
    }

    // making post while not authenticated
    else{
      return{
        status: 404, 
        body: "Invalid user"
      }
    }

    const category = request.params.category;
    let category_data = []


    const client = await mongoClient.connect(process.env.AZURE_MONGO_DB)
    const category_id = await client.db("todo_hw").collection("categories").find({name: category}).toArray()
    if(category_id.length > 0){
      let actual_id = category_id[0]._id
      // prevent 500 errors
      if(!ObjectId.isValid(actual_id)){
        console.log("Wrong")
        return {
          status:404,
          jsonBody: {error: "Invalid ID"}
      }
    }
      let result = await client.db("todo_hw").collection("todos").find({_category: new ObjectId(actual_id), completed: true, user_id: user_id}).toArray()

      // sort by most recent
      result = sortRecent(result)
      category_data = result
    }

    else{
      return{
        status: 404, 
        body: "Invalid Category Asked For"
      }
    }
    
    client.close()

    payload = {category_data, category}
    console.log(payload)
        
    return {
        headers:{
            'Content-Type': 'application/json'
        },
        jsonBody: {data: payload}
    }
  }
})


app.http('getCategories', {
  methods: ['GET'], 
  authLevel: 'anonymous',
  route: 'categories',
  handler: async (request, context) => {
    const header = request.headers.get('x-ms-client-principal');
    const encoded = Buffer.from(header, 'base64');
    const decoded = encoded.toString('ascii');
    let clientPrincipal = JSON.parse(decoded);
    let user_id;
    
    if(clientPrincipal && clientPrincipal["userRoles"].includes('anonymous') && clientPrincipal["userRoles"].includes("authenticated")){
      user_id = clientPrincipal["userId"]
    }

    // trying to access while not authenticated
    else{
      return{
        status: 404, 
        body: "Invalid user"
      }
    }


    const client = await mongoClient.connect(process.env.AZURE_MONGO_DB)
    const categories = await client.db("todo_hw").collection("categories").find({user_id: user_id}).toArray()
    client.close();
    return {
        headers:{
            'Content-Type': 'application/json'
        },
        jsonBody: {data: categories}
    }
  },
})


// add endpoint for adding categories 
app.http('addCategory', {
  methods: ['POST'], 
  authLevel: 'anonymous',
  route: 'category',
  handler: async (request, context) => {
    const header = request.headers.get('x-ms-client-principal');
    const encoded = Buffer.from(header, 'base64');
    const decoded = encoded.toString('ascii');
    let clientPrincipal = JSON.parse(decoded);
    let user_id;
    
    if(clientPrincipal && clientPrincipal["userRoles"].includes('anonymous') && clientPrincipal["userRoles"].includes("authenticated")){
      user_id = clientPrincipal["userId"]
    }

    // making post while not authenticated
    else{
      return{
        status: 404, 
        body: "Invalid user"
      }
    }


    let body = await request.json();
    let name = body.category_name

    
    
    if(name){
      // final checks for category being valid
      const client = await mongoClient.connect(process.env.AZURE_MONGO_DB)
      const all_categories = await client.db("todo_hw").collection("categories").find({}).toArray()
      

      let name_list = []
      for(let i = 0; i < all_categories.length; i++){
        name_list.push(all_categories[i]["name"])
      }
      // check duplicate 
      for(let i = 0; i < name_list.length; i++){
        if(name_list[i] === name){
          return {
            status: 404, 
            body: "Invalid Category Name"
          }
        }
      }
      // check length
      if(name.length < 1 || name.length > 50){
        return {
          status: 404, 
          body: "Invalid Category Name"
        }
      }
      payload = {name, user_id}

      const result = await client.db("todo_hw").collection("categories").insertOne(payload)
      client.close();

      return{
          status: 201,
          jsonBody: {name: name}
      };
    }

    else{
      return{
        status: 404, 
        body: "Invalid Update"
      }
    }
    
  },
})


// add endpoint for deleting categories
app.http("deleteTodo", {
  methods: ['DELETE'], 
  authLevel: 'anonymous',
  route: 'delete/todo',
  handler: async (request, context) =>{
    const header = request.headers.get('x-ms-client-principal');
    const encoded = Buffer.from(header, 'base64');
    const decoded = encoded.toString('ascii');
    let clientPrincipal = JSON.parse(decoded);
    let user_id;
    
    if(clientPrincipal && clientPrincipal["userRoles"].includes('anonymous') && clientPrincipal["userRoles"].includes("authenticated")){
      user_id = clientPrincipal["userId"]
    }

    // trying to access while not authenticated
    else{
      return{
        status: 404, 
        body: "Invalid user"
      }
    }

    let body = await request.json();

    let id_deletion = body.id

    const client = await mongoClient.connect(process.env.AZURE_MONGO_DB)
    // check for completion first, if incomplete just end this function (only uncompleted items can be interacted with)
    let completed = await client.db("todo_hw").collection("todos").find({_id: new ObjectId(id_deletion)}).toArray()
      if(completed.length > 0){
        if(completed[0]["completed"] != false){
          client.close()
          return{
            status: 400, 
            body: "Invalid Update, Item Already Complete"
          }
        }
      }
    const result = await client.db("todo_hw").collection("todos").deleteOne( {"_id": new ObjectId(id_deletion)} )
    client.close();

    if(result.deletedCount > 0){
      return {
        status: 200,
        jsonBody: {status: "ok"}
      }
    }

    else{
      return{
        status: 404, 
        body: "Invalid delete"
      }
    }

  }

})

// ALSO NEED TO GO THROUGH AND REMOVE CATEGORY FROM ALL TODO ITEMS THAT HAVE THE GIVEN CATEGORY
app.http("deleteCategory", {
  methods: ['DELETE'], 
  authLevel: 'anonymous',
  route: 'delete/category',
  handler: async (request, context) =>{
    const header = request.headers.get('x-ms-client-principal');
    const encoded = Buffer.from(header, 'base64');
    const decoded = encoded.toString('ascii');
    let clientPrincipal = JSON.parse(decoded);
    let user_id;
    
    if(clientPrincipal && clientPrincipal["userRoles"].includes('anonymous') && clientPrincipal["userRoles"].includes("authenticated")){
      user_id = clientPrincipal["userId"]
    }

    // trying to access while not authenticated
    else{
      return{
        status: 404, 
        body: "Invalid user"
      }
    }

    let body = await request.json();

    let category_deletion = body.category

    const client = await mongoClient.connect(process.env.AZURE_MONGO_DB)
    // first get the id for the category
    // names being unique is also enforced for categories, so this is guaranteed to give one item
    const categ_id = await client.db("todo_hw").collection("categories").find({"name": category_deletion}).toArray()
    let categoryId;

    
    if(categ_id.length > 0){
      categoryId = categ_id[0]._id
    }

    
    // now update the todos collection so all todos associated with deleted categories are changed to having no category
    // aka having "n/a" as their category
    await client.db("todo_hw").collection("todos").updateMany({_category: new ObjectId(categoryId)}, {$set: {_category: "n/a"}})


    const result = await client.db("todo_hw").collection("categories").deleteOne( {"name": category_deletion} )

    
    client.close();


    if(result.deletedCount > 0){
      return {
        status: 200,
        jsonBody: {status: "ok"}
      }
    }

    else{
      return{
        status: 404, 
        body: "Invalid delete"
      }
    }

  }

})


