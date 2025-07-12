/* asyncHandler function is a custom wrapper for handling errors in asynchronous express route handlers so you dont have to write try and catch in every single route instead of this we make a generalised function */
// (Like a helper layer) 

// const asyncHandler = () => {}

// export {asyncHandler}


// const asyncHandler = () => {}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => async () => {}

const asyncHandler = (func) => async (req , res , next) => {
    try{
        return await func(req , res, next);
    }

    catch(error){
        res.status(error.code || 500).json({
            success: false,
            message: error.message
        })
    }
}

export {asyncHandler}