import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const generateAccessAndRefreshTokens= async(userId)=>{
    try{
        const user = await User.findById(userId)
        const accessToken= user.generateAccessToken()
        const refreshToken= user.generateRefreshToken()

        user.refreshToken=refreshToken   //to save refresh token to database
        await user.save({validateBeforeSave: false}) 
        
        return {accessToken,refreshToken}

    }catch(error){
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}



const registerUser=asyncHandler(async(req,res)=>{
    // res.status(200).json({
    //     message:"Hey Kashu!!"
    // })

    //STEPS TO REGISTER USER
    //1. Get details from user
    //2. Validate details, validation-not empty
    //3. check if user already exists:username,email
    //4. check for images,check for avatar
    //5. upload them to cloudinary,avatar
    //6. create user object- create entry in db
    //7. remove password and refresh token field from response
    //8. chec for user creation
    //9. return response

    const{fullname,email,username,password}=req.body   //if data is coming from form/json, use req.body(default from express) to extract it
    //console.log("email: ",email)

    // if(fullName==""){
    //     throw new ApiError(400,"Full Name is required")   //we can check for each field like this individually
    // }

    //better method to check for validation of fields 
    if(
        [fullname,email,username,password].some((field)=>
        field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required")
    }

    const existedUser=await User.findOne({                                   //returns the first matched object
        $or:[{username},{email}]                     //check for same username or email
    })

    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")
    }

    // const avatarLocalPath= req.files?.avatar[0]?.path  //req.files is a method of multer to access files,we are accessing everything from middleware
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    // //standard practice to check
    // let coverImageLocalPath;
    // if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
    //     coverImageLocalPath= req.files.coverImage[0]
    // }

    console.log("Avatar local path:", avatarLocalPath);
    console.log("Cover image local path:", coverImageLocalPath);

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )      //user._id is because mongoDb assigns a unique id to each entry
           //.select(-field) means this "field" will be removed
    
    if(!createdUser){
        throw new ApiError(500,"something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(201,createdUser,"User Registered Successfully!")
    )


})

const loginUser = asyncHandler(async(req,res)=>{
    //To-do list to login user
    //1. req body->data
    //2. username or email for access
    //3. find the user
    //4. password check
    //5. access and refresh token 
    //6. send cookies

    const {email,username,password}= req.body
    if(!username || !email){
        throw new ApiError(400,"username or password is required")
    }

    const user= await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User does not exist")
    }
    
    const isPasswordValid= await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"Password Incorrect")
    }

    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)

    const loggedInUser=User.findById(user._id).
    select("-password -refreshToken")                 //avoid sending password , refreshtoken to user when we send cookies

    const options={
        httpOnly:true,
        secure:true
    }

    //cookies can be modified by anyone by default but when we set the above options it can only be modfied by the server

    return res.status(200)
    .cookie("accessToken", accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "User logged in Successfully!"
        )
    )

})

const logoutUser= asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set :{
                refreshToken:undefined
            }
        },{
            new:true
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged Out Successfully"))
})

export {
    registerUser,
    loginUser,
    logoutUser
}