import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import jwt from "jsonwebtoken"
const generateAccessTokenandRefreshToken = async(userId) => {
    try{
        const user = User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken , refreshToken}
    }
    catch(eror){
        throw new ApiError(500 , "Something went wrong while generating access and refresh tokens");
    }
}
const registerUser = asyncHandler( async (req , res) => {
    // Get user details from frontend
    // Validation - not empty
    // check if user already exists: username , email
    // check for images , check for avatar
    // upload them on cloudinary , check for avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check user created or not
    // if created then return the response


    // Get user details from frontend
    const {fullName , email , username , password} = req.body;
    console.log("email: " , email);


    // validation - not empty
    if(
        [fullName , email , username , password].some((field) => 
        field?.trim() === "")
    ){
        throw new ApiError(400 , "All fields are required");
    }

    // check if user already exists?
    const existingUser = await User.findOne({
        $or: [{username} , {email}]
    })

    if(existingUser){
        throw new ApiError(409 , "User already exits");
    }

    console.log(req.files);

    // check for images , check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverLocalPath = req.files?.coverImage[0]?.path;

    let coverLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar file is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!coverLocalPath){
        throw new ApiError(400 , "Cover Image is required");
    }
    const coverImage = await uploadOnCloudinary(coverLocalPath);

    if(!avatar){
        throw new ApiError(400 , "Avatar file is required");
    }


    // create entry of user in database
    const user = await User.create({
        fullName,
        email,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
        username: username.toLowerCase()
    })

    

    // check user created or not and remove password and refresh token field from the response
    const checkUserCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!checkUserCreated){
        throw new ApiError(500 , "User is not created");
    }


    return res.status(201).json(
        new ApiResponse(200 , checkUserCreated , "User Registered Successfully")
    )
})


const loginUser = asyncHandler(async(req , res) => {
    // take details from frontend
    // check user entered username or email or nothing
    // check whether the details (data) present in db or not
    // if present password check
    // server generates access and refresh token
    // server send this tokens to frontend through cookies
    // now you are logged in


    // take data from frontend
    const {username , email , password} = req.body

    if(!(username || email)){
        throw new ApiError(400 , "username or email is required");
    }

    // check present in db or not
    const existedUser = await User.findOne({
        $or: [{username} , {email}]
    })

    if(!existedUser){
        throw new ApiError(404 , "User does not exist");
    }

    // password check
    const isPasswordValid = await existedUser.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401 , "Invalid user credentials");
    }


    // generate tokens
    const {accessToken , refreshToken} = await generateAccessTokenandRefreshToken(existedUser._id);


    // Send in cookie
    const loggedInUser = await User.findById(existedUser._id).select(
        "-password -refreshToken"
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
        new ApiResponse(
            200,
            {
                existedUser: loggedInUser,accessToken,refreshToken
            },

            "User logged in successfully"
        
        )
    )
})


const logoutUser = asyncHandler(async (req , res) => {
    
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json(new ApiResponse(201 , {} , "User Logged Out"))
})

const refreshAccessToken = asyncHandler(async (req , res) => {

    const incomingRequestToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRequestToken){
        throw new ApiError(401 , "Unauthorized Request");
    }

    try {
        const decodedToken = jwt.verify(incomingRequestToken , process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401 , "Invalid refreh Token");
        }
    
        if(incomingRequestToken !== user?.refreshToken){
            throw new ApiError(401 , "Refresh Token is expired");
        }
    
        const {accessToken , newrefreshToken} = await generateAccessTokenandRefreshToken(user._id);
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res.status(200)
        .cookie("accessToken" , accessToken , options)
        .cookie("refreshToken" , newrefreshToken , options)
        .json(new ApiResponse(200 , {accessToken , refreshToken: newrefreshToken} , "Access Token Refresh Successfully"))
    
    } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid Refresh Token")
    }
})


const changeCurrentPassword = asyncHandler(async (req , res) => {

    const {oldPassword , newPassword} = req.body

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400 , "Incorrect Password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false});

    return res.status(200)
    .json(new ApiResponse(200 , {} , "Password Changed Successfully"));
})

const getCurrentUser = asyncHandler(async (req , res) => {
    return res.status(200)
    .json(new ApiResponse(200 , req.user , "Current user fetched"))
})

const updateAccountDetails = asyncHandler(async(req , res) => {

    const {fullName , email} = req.body

    if(!(fullName || email)){
        throw new ApiError(401 , "Fullname and email is required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        {new: true}
    )
    .select(
        "-password -refreshToken"
    )

    return res.status(200)
    .json(new ApiResponse(200 , user , "Account Details Updted Successfully"));
})

const updateAvatar = asyncHandler(async (req , res) => {

    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar File is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(400 , "Error while uploading on cloudinary");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },

        {new: true}
    ).select(
        "-password -refreshToken"
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails
}