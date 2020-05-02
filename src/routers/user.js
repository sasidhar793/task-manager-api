const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const router = new express.Router()

//save users object in DB
router.post('/users', async(req,res)=>{
    const user = new User(req.body)
         try{
            await user.save()
            const token = await user.generateAuthToken()
            res.status(201).send({user,token})
         }catch(e){
             res.status(400).send(e)
         }
    })

    //login 
   router.post('/users/login', async (req,res)=>{
          try{
              const user = await User.findByCredentials(req.body.email,req.body.password)
              const token = await user.generateAuthToken()
              res.send({user,token})
          }catch(e){
              res.status(400).send()
          }
   })
    
//logout
router.post('/users/logout'), async(req,res)=>{
    try{
        req.user.tokens = req.user.tokens.filters((token)=>{
            return token.token !==req.token
        })
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send()
    }
}

//logout all
router.post('/users/logoutAll', async (req,res)=>{
   try{
        req.user.tokens = []
        await req.user.save()
        res.send()
   }catch(e){
       res.status(500).send()

   }
})
    //get all Users from DB with authentication
    router.get('/users', auth, async(req,res)=>{
      try{
          const users = await User.find({})
          res.send(users)
      }catch(e){
        res.status(500).send()
      }
    })

    //get login User from DB with authentication
    router.get('/users/me', auth, async(req,res)=>{
       res.send(req.user)
      })
    
    //get User with Id from DB
    router.get('/users/:id', async(req,res)=>{
        const _id = req.params.id
        try{
            const user = await User.findById(_id)
            if(!user){
                return res.status(404).send()
            }
            res.send(user)
        }catch(e){
            res.status(500).send()
        }
       
    })
    
    //update user by id
    router.patch('/users/:id', async(req,res)=>{
        const updates = Object.keys(req.body)
        const allowedUpdates = ['name','email','password','age']
        const isValidOperation = updates.every((update)=> allowedUpdates.includes(update))
        if(!isValidOperation){
            return res.status(400).send({"error":"Invalid update"})
        }
        try{
            const user = await User.findById(req.params.id)
            updates.forEach((update)=>user[update] = req.body[update])
            user.save()
           if(!user){
               return res.status(404).send()
           }
           res.send(user)
        }catch(e){
           res.status(400).send()
        }
    })
    
//Updating me
router.patch('/users/me',auth, async(req,res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name','email','password','age']
    const isValidOperation = updates.every((update)=> allowedUpdates.includes(update))
    if(!isValidOperation){
        return res.status(400).send({"error":"Invalid update"})
    }
    try{
       
        updates.forEach((update)=>req.user[update] = req.body[update])
        req.user.save()
        res.send(req.user)
    }catch(e){
       res.status(400).send(e)
    }
})

    //delete user by id
    router.delete('/users/:id',auth, async(req,res)=>{
        try{
           const user = await User.findByIdAndDelete(req.params.id)
           if(!user){
               res.status(404).send()
           }
           res.send(user)
        }catch(e){
           res.status(500).send()
        }
    })

     //delete user their own
     router.delete('/users/me',auth, async(req,res)=>{
        try{
        //    const user = await User.findByIdAndDelete(req.user._id)
        //    if(!user){
        //        res.status(404).send()
        //    }
           await req.user.remove()
           res.send(req.user)
        }catch(e){
           res.status(500).send()
        }
    })
//Upload File

const avatar = multer({
   // dest:'avatars',
    limits:{
        fileSize:1000000
    },
    fileFilter(req,file,cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('Please upload .jpg , .jpeg, .png files only'))
        }
        cb(undefined,true)
    }
})
router.post('/users/me/avatar',auth,avatar.single('avatar'),async(req,res)=>{
    const buffer = await sharp(req.file.buffer).resize({width:250,height:250}).png().toBuffer() //to upload image with change
   //req.user.avatar =  req.file.buffer  to upload image without changing
   req.user.avatar =  buffer 
   await req.user.save()
   res.send()
},(error,req,res,next)=>{
   res.status(400).send({error:error.message})
})


//delete uploaded file

router.delete('/users/me/avatar',auth,async(req,res)=>{
    req.user.avatar = undefined
    await req.user.save()
})

//fetch image by user Id
router.get('/users/:id/avatar', async(req,res)=>{
try{
    const user = await User.findById(req.params.id)
    if(!user || !user.avatar){
        throw new Error()
    }
    res.set('Content-type','image/jpg')
    res.send(user.avatar)
}catch(e){
    res.status(404).send()
}
})

//convertion of files

module.exports = router