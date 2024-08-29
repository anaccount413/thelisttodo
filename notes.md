Main things to consider when inputting each todo item into data storage


Contents
Time Generated
Completion status
Account associated with todo item
Category associated with todo item


Decision: Going to have 2 main collections, categories and todos. Todos will each have a category document associated with it(rather than a category object having all the todos in it associated with it). This is analagous to the form 4 approach that was seen in class during session 22, and is designed with the fact that there are many more todos than categories in mind. Also, a todo can end up with no category. 



TRY DEPLOYING THE PREVIOUS AZURE APP AGAIN AND SEE WHAT DIFFERENCES THERE ARE