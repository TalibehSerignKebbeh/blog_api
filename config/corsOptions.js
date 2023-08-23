
const corsoptions ={
    origin:(origin, callback) => {
       const origins = process.env?.ORIGINS?.split(' ');
    if (origins && origins?.length && (origin?.indexOf(origin) !== -1)) {

            callback(null, true)
        } else {
            callback(new Error(`Not allowed by cors from orign ${origin}`))
        }
    },
    optionsSuccessStatus: 200,
    credentials:true,
}

module.exports ={corsoptions}