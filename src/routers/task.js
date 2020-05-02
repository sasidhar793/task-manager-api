const express = require('express')
const Task = require('../models/tasks')
const auth = require('../middleware/auth')
const router = new express.Router()


//save tasks object in DB
router.post('/tasks',auth, async(req,res)=>{
   const task =  new Task({
       ...req.body,
       Owner:req.user._id
   })
    try{
       await task.save()
       res.status(201).send(task)
    }catch(e){
       res.status(400).send(e)
    }
})

//get all Tasks from DB   // grt /tasks?completed=false get tasks with condition
                           //Get  /tasks?limit=10&skip=0  get tasks with limit number(pagenation)
                           //Get  /tasks?sortBy=createdAt:asc    sorting tasks
router.get('/tasks',auth, async(req,res)=>{
    const match = {}
    const sort = {}
    if(req.query.completed){
        match.completed = req.query.completed === 'true'
    }
    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc'? -1 : 1
    }
    try{
       //const tasks = await Task.find({})
      // const tasks = await Task.find({owner:req.user._id})
      await req.user.populate({
          path:'tasks',
          match,
          options:{
              limit:parseInt(req.query.limit),
              skip:parseInt(req.query.skip),
              sort
          }
      }).execPopulate()
       res.send(req.user.tasks)
    }catch(e){
       res.status(500).send()
    }
})

//get a task from DB with Id
router.get('/tasks/:id',auth, async(req,res)=>{
    const _id = req.params.id
    try{
      // const task = await Task.findById(_id)
      const task = await Task.findOne({_id,owner:req.user._id})
       if(!task){
        return res.status(404).send()
       }
       res.send(task)
    }catch(e){
       res.status(500).send()
    }
})

//update a task by id
router.patch('/tasks/:id',auth, async(req,res)=>{
    const updates = Object.keys(req.body)
    const allwedUpdates = ['description','completed']
    const isvalidOperation = updates.every((update)=> allwedUpdates.includes(update))
    if(!isvalidOperation){
        res.status(400).send({"error":"Invalid Update!"})
    }
    try{
        const task = await Task.findOne({_id:req.params.id,owner:req.user._id})
      //  const task = await Task.findById(req.params.id)
        updates.forEach((update)=>task[update] = req.body[update])
       await  task.save()
        // if(!task){
        //     return res.status(400).send()
        // }
        res.send(task)
    }catch(e){
        res.status(400).send(e)
    }

})

//delete a task by id
router.delete('/tasks/:id',auth, async(req,res)=>{
    try{
   // const task = await Task.findByIdAndDelete(req.params.id)
   const task = await Task.findOneAndDelete({_id:req.params.id,owner:req.user._id})
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    }catch(e){
        res.status(500).send()
    }
})



module.exports = router
