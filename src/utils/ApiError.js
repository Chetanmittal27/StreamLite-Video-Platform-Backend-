// Think of ApiError as a custom blueprint for the kind of errors you want your app to send back. It’s all about formatting and standardizing errors.



class ApiError extends Error{

    constructor(
        statusCode,
        message = "Something Went Wrong",
        data,
        error = [],
        stack = ""
    ){
        super(message)                         // This calls the parent class (Error) constructor and passes the error message to it.
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = this.errors
    }
}

export {ApiError}