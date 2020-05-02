const mongoose = require('mongoose')


mongoose.connect(process.env.DB_PATH,{
useNewUrlParser:true,
useUnifiedTopology:true,
useCreateIndex:true,
useFindAndModify:false
})