var express = require('express');
var router = express.Router();

function fn(req, res, next){
  if(__connectOdoo){
    res.set('X-Hit', '1');
    next();
  }else{
    console.log('Unable to connection to odoo');
  }
};

router.use('/odoo', fn, router);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/sample', function(req, res, next) {
  res.render('sample', { title: 'Sample' });
});

router.get('/employees', function(req, res, next) {
  res.render('employees', { title: 'Employees' });
});

router.get('/attendance', function(req, res, next) {
  res.render('attendance', { title: 'Attendance' });
});

router.post('/odoo/employees', function(req, res, next) {
  const post = req.body;
  let data = detectNumeric(post['data[]']);

  // __odoo.get('hr.employee', data, function (err, employee) {
  //   console.log('data', data);
  //   console.log('employee', employee.length);
  //   if (err) { return console.log(err); }
  //   const arr = []
    
  //   for (var i = 0; i < employee.length; i++) { 
  //     const e = {
  //       id: employee[i].id,
  //       name: employee[i].name,
  //       barcode: employee[i].barcode,
  //       user_id: employee[i].user_id,
  //       // biometric_id: employee[i].biometric_id,
  //       // scan1: employee[i].scan1,
  //       // scan2: employee[i].scan2,
  //       // scan3: employee[i].scan3,
  //     };
  //     arr.push(e);
  //   }
  //   res.send({result: arr});
  //   console.log(arr);
  // });

  var params = [['id','>',-1]];

  __odoo.search('hr.employee', params, function(err, employee) {
    if (err) { return console.log(err); }
    __odoo.get('hr.employee', employee, function (err, print) {
      if (err) { return console.log(err); }
      const arr = []
      for (var i = 0; i < print.length; i++) { 
        const e = {
          id: print[i].id,
          name: print[i].name,
          barcode: print[i].barcode,
          user_id: print[i].user_id,
          // biometric_id: employee[i].biometric_id,
          // scan1: employee[i].scan1,
          // scan2: employee[i].scan2,
          // scan3: employee[i].scan3,
        };
        arr.push(e);
      }
      res.send({result: arr});
      console.log(arr);
    });
  });
});


router.post('/odoo/employee/update', function(req, res, next) {
  const post = req.body;
  let update_data = post['data[]'];
  let id = post['id[]'];

  // update employee info
  // const update_data = {
  //   biometric_id: 12345,
  //   scan1: 54321,
  //   scan2: 09876,
  //   scan3: 67890,
  // };

  __odoo.update('hr.employee', 12, update_data, function (err, employee){
    if (!err){ console.log('success'); }
    else {console.log('error');}
  });
});

router.post('/odoo/attendance/fingerprint', function(req, res, next) {
  const post = req.body;
  var params = [['biometric_line','!=',false]];

  __odoo.search('hr.employee', params, function(err, employee) {
    if (err) { return console.log(err); }
    __odoo.get('employee.fingerprint', employee, function (err, print) {
      if (err) { return console.log(err); }
      res.send({result: print});
    });
  });
});

router.post('/odoo/attendance/checkin', function(req, res, next) {
  const post = req.body;
  let data = detectNumeric(post['id']);

  var params = {employee_id: parseFloat(data)};

  __odoo.create('hr.attendance', params, function (err, employee){
    if (!err){ 
      res.send({result: employee});
    }else {console.log(err);}
  });
});

router.post('/odoo/attendance/checkout', function(req, res, next) {
  // const post = req.body;
  // let data = detectNumeric(post['id']);
  // let id = parseFloat(data);
  // var update_params = {check_out: new Date().toUTCString()};
  // var search_params = [['employee_id','=',id], ['check_out', '=', false]];

  // __odoo.search('hr.attendance', search_params, function (err, employee){
  //   if (!err){ 
  //     const attendance_id = employee[0];

  //     __odoo.update('hr.attendance', attendance_id, update_params, function (err, employee){
  //       if (!err){
  //         res.send({result: employee});
  //       } else {console.log(err);}
  //     });
  //   }else {console.log(err);}
  // });
});

// router.post('/odoo/attendance/check', function(req, res, next) {
//   const post = req.body;
//   let data = detectNumeric(post['id']);
//   let id = parseFloat(data);

//   let current_datetime = new Date();

//   var params = [['employee_id','=',id], ['check_in', '<', current_datetime], ['check_out', '=', false]];

//   __odoo.search('hr.attendance', params, function (err, employee){
//     if (!err){ 
//       if (employee.length > 0){
//         res.send({checked_id: true, checked_out: false});        
//       }else{
//         res.send({checked_id: false, checked_out: false});
//       }
//     }else {console.log(err);}
//   });
// });

router.post('/api/getUser', async function(req, res){
  let response = {
    userlist: [],
    userdata:[]
  }
  const getEmployeeID = await seachOdoo('hr.employee', [['id','>',-1]]);
  if(getEmployeeID && getEmployeeID.length){
    const count = getEmployeeID.length;
    for(let x = 0; x < count; x++){
      const getEmployeeData = await getOdoo('hr.employee',getEmployeeID[x]);
      if(getEmployeeData && getEmployeeData.length){
        let localdata = {}
        localdata.id = getEmployeeData[0].id;
        localdata.name = getEmployeeData[0].name;
        response.userlist.push(localdata);
        response.userdata.push(getEmployeeData[0].name);
      }
    }
  }
  console.log('=================================================================')
        console.log(response);
  res.send({status: false, message: 'No message'});
})

router.post('/api/register', function(req, res, next) {
  var post = req.body;
  post.scan1 = post.scan1.split(' ').join('+');
  post.scan2 = post.scan2.split(' ').join('+');
  post.scan3 = post.scan3.split(' ').join('+');
  post.fingerprint_id = post.customId;  
  post.user_id = post.user_id;
  console.log('================ test register ================');
  console.log(post);
  var params = {user_id: post.user_id, fingerprint_id: post.fingerprint_id, scan1: post.scan1, scan2: post.scan2, scan3: post.scan3};
  __odoo.create('employee.fingerprint', params, function (err, register){
    if (!err){ 
      console.log("============= || ============");
      console.log(register);
      res.send({status: true});
    }else {
      console.log("============= || err ============");
      console.log(err);
      res.send({status: false, message: "Test Error"});
    }
  });
});

router.post('/api/getFingerprint',async function(req, res, next) {
  let fingerPrintList = [];
  const getFingerPrintIndex = await seachOdoo('employee.fingerprint', [['id','>',-1]]);
  if(getFingerPrintIndex && getFingerPrintIndex.length){
    let count = getFingerPrintIndex.length;
    for(let x = 0; x < count; x++){
      const result = await getSingleFingerPrint(getFingerPrintIndex[x]);
      if(result){
        fingerPrintList.push(result);
      }
    }
    let response = {
      userlist: [],
      userdata:[]
    }
    const getEmployeeID = await seachOdoo('hr.employee', [['id','>',-1]]);
    if(getEmployeeID && getEmployeeID.length){
      const count = getEmployeeID.length;
      for(let x = 0; x < count; x++){
        const getEmployeeData = await getOdoo('hr.employee',getEmployeeID[x]);
        if(getEmployeeData && getEmployeeData.length){
          let localdata = {}
          localdata.id = getEmployeeData[0].id;
          localdata.name = getEmployeeData[0].name;
          response.userlist.push(localdata);
          response.userdata.push(getEmployeeData[0].name);
        }
      }
    }
    res.send({fingerprint: fingerPrintList, userlist:response.userlist, userdata:response.userdata});
  }

});

router.post('/api/login', async function(req, res, next) {
  const post = req.body;
  console.log('================ post ==============')
  console.log(post)
  let data = detectNumeric(post.user_id);
  let id = parseFloat(data);
  let current_datetime = new Date();
  console.log(data, id);
  const cond = [['employee_id','=',id], ['check_in', '<', current_datetime], ['check_out', '=', false]];
  const checkAttendance = await seachOdoo('hr.attendance', cond);
  console.log('+++++++++++++++++++')
  console.log(checkAttendance);
  if(checkAttendance.length){
    // checkout 
    const update_params = {check_out: new Date().toUTCString()};
    const checkoutID = checkAttendance[0];
    console.log('===');
    console.log(checkoutID);
    const checkout = await updateOdoo('hr.attendance', checkoutID, update_params);
    if(checkout.status){
      res.json({status: true, message: "Success Checkout."});
    }else{
      res.json({status: false, message: checkout.message});
    }
  }else{
    // checkin
    let params = {employee_id: parseFloat(id)};
    let createAttendance = await createOdoo('hr.attendance', params);
    console.log('=================');
    console.log(createAttendance);
    res.json({status: true, message: 'Success Checkin'});
  }
});

const updateOdoo = function(model, id, param){
  return new Promise(function(resolve, reject){
    __odoo.update(model, id, param, function (err, employee){
      if (!err){ 
        resolve({status: true, data: employee});
      }else {
        reject({status: false, message: err});
      }
    });
  })
}

const createOdoo = function(model, param){
  return new Promise(function(resolve, reject){
    console.log("=+++++==+++=+===+++",model, param);
    __odoo.create(model, param, function (err, employee){
      if (!err){ 
        resolve({status: true, data: employee});
      }else {
        reject({status: false, message: err});
      }
    });
  })
}

const seachOdoo = function(model, condition){
  return new Promise( function(resolve, reject){
    __odoo.search(model, condition, function (err, response) {
      if(err){
        reject(err);
      }else{
        resolve(response);
      }
    })
  });
}

const getOdoo = function(model, condition){
  return new Promise( function(resolve, reject){
    __odoo.get(model, condition, function (err, response) {
      if(err){
        reject(err);
      }else{
        resolve(response);
      }
    })
  });
}

let getSingleFingerPrint = function(param){
  return new Promise(function(resolve, reject){
    __odoo.get('employee.fingerprint', param, function (err, fingerprint) {
      if(fingerprint.length){
        const data = fingerprint[0];
        let output = {};
        output.scan1 = data.scan1;
        output.scan2 = data.scan2;
        output.scan3 = data.scan3;
        output.fingerprint_id = data.fingerprint_id;
        output.user_id = data.user_id;
        resolve(output);
      }else{
        resolve(false);
      }
    });
  })
}

function detectNumeric(obj) {
  for (var index in obj) {
    if (!isNaN(obj[index])) {
      obj[index] = Number(obj[index]);
    }
  }
  return obj;
} 

module.exports = router;
