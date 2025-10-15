const { model } = require("mongoose");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const signup = async (req, res)=>{
    const {username, email, password} = req.body;

    try {

        const userExists =await User.findOne({email})

        if(userExists){

          return res.status(400).json({message:"user is already exist"})
        } 

        const user = await User.create({
            username, 
            email,
            password
        })

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {
            expiresIn:"30d"
        })
        res.status(201).json({message: "user created", token, userId:user._id})
        
    } catch (error) {
        res.status(500).json({message: error.message})
    }

}

const login = async (req, res)=>{
    const { email, password} = req.body;

    try {
        
        const user = await User.findOne({email});
        if(!user) {
            return res.status(400).json({message:"Invalid User Details"})
        }

        const matches = await user.matchPassword(password)
        if(!matches){
            return res.status(400).json({message:"Invalid User Details"})
        }

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {
            expiresIn:"30d"
        })
        res.status(200).json({message: "Login Successfully", token, userId:user._id})
        
    } catch (error) {
        res.status(500).json({message: error.message})
    }

}

module.exports = { signup, login}