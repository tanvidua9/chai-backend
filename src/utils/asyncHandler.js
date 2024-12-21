//utility function using promise
const asyncHandler = (requestHandler) => {
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).
        catch((err) => next(err))
    }

}

export {asyncHandler}





//function for utility using try catch 
// const asyncHandler =(fn)=> async(req,res,next) => {
//     try{
//         await fn(req,res,next)
//     }catch(error){
//         res.status(err.code|| 500).json({
//             success:false,
//             message:err.message
//         })
//     }
// }