const snowflake = require('../database/snowflake.js');

const WH = function() {}

WH.meta = (wh_name,cb) => { 
      
      var sql = "show warehouses like '" + wh_name + "' "
      snowflake.query(sql,[]).then(rows => {cb(null, rows)}).catch(err => {cb(err, null)});
    
  }

  WH.whCommand = (wh_name,command,cb) => { 
     
    var sql = "ALTER WAREHOUSE "+ wh_name+ " "+ command
    snowflake.query(sql,[]).then(rows => {cb(null, rows)}).catch(err => {cb(err, null)});
  
}


module.exports = WH;