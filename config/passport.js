require('dotenv').config()

const passport=require('passport')
const googleStrategy=require('passport-google-oauth20').Strategy;
const User=require('../models/userSchema')


passport.use(new googleStrategy({
    clientID:process.env.googleClientId,
    clientSecret:process.env.googleClientSecret,
    callbackURL:'/auth/google/callback',
    scope: ['profile', 'email'],
}, 
async (accessToken,refreshToken,profile,done)=>{
    try {
        let user = await User.findOne({ googleId: profile.id });

        if(user){
            return done(null,user)
        }else{
            user=new User({
                name:profile.displayName,
                email:profile.emails[0].value,
                googleId:profile.id,

            })
            await user.save();
            return done(null,user)
        }
        
    } catch (error) {
        return done(error,null)
        
    }
}
 
))
//serializing the details of the user to  assign it to the session
passport.serializeUser((user,done)=>{
    done(null,user.id)
})

//to fetch the data from the session of the usser

passport.deserializeUser((id,done)=>{
    User.findById(id)
    .then(user=>{
        done(null,user)
    })
    .catch(err=>{
        done(err,null)

    })
})

module.exports=passport