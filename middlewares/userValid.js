const  userValid= async(req,res,next)=>{

    // res.locals.user = req.session.user
    
    //  console.log('locals',res.locals.user)
     console.log('session',req.session)
     next()
}


module.exports={
    userValid
}