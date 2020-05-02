const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Task = require('./tasks')
const userSchema = new mongoose.Schema({
    name:{
        type:String,
        require:true,
        trim:true
    },
    email:{
        type:String,
        require:true,
        unique:true,
        trim:true,
        lowercase:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid')
            }
        }
    },
    password:{
        type:String,
        require:true,
        trim:true,
        minlength:7,
        validate(value){ 
        if(value.toLowerCase().includes('password')){
          throw new Error('password cannot contain "password"')  
        }
        }
    },
    age:{
        type:Number,
        default:0,
        validate(value){
          if(value<0){
              throw new Error('Age must be a positive Number')
          }
        }
    },
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }],
    avata:{
        type:Buffer
    }
},{
    timestamps:true
})
//vertual ref to another model (Task)
userSchema.virtual('tasks',{
    ref:'Task',
    localField:'_id',
    foreignField:'owner'
})
//Delete user tasks when user is removed
userSchema.pre('remove',async function(next){
    const user = this
    await Task.deleteMany({owner:user._id})
    next() 
})
userSchema.methods.generateAuthToken = async function(){
    const user = this
    const token = jwt.sign({_id:user._id.toString()},process.env.JWT_ENV)
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}

userSchema.methods.toJSON = function(){
    const user = this
    const userObject =  user.toObject()
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar
    return userObject
}

//login validation with custom function with schema
userSchema.statics.findByCredentials = async (email,password)=>{
       const user = await User.findOne({email})
       if(!user){
           throw new Error('Unabel to login')
       }
       const isMatch = await bcrypt.compare(password,user.password)
       if(!isMatch){
           throw new Error('Unable to login')
       }

       return user
}

//Hash plain text password before saving
userSchema.pre('save', async function(next){
     const user = this
     if(user.isModified('password')){
         user.password = await bcrypt.hash(user.password,8)
     }
     
     next()
})
const User = mongoose.model('User',userSchema)

module.exports = User