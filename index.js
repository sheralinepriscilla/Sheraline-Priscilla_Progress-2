const express = require('express')
const mysql = require('mysql')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
var session = require('express-session');

const app = express()
const port = 8000;
const secretKey = 'thisisverysecretkey'
const db = mysql.createConnection({
    host: '127.0.0.1',
    port: '3306',
    user: 'root',
    password: '',
    database: "opd"
}) 

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}))

//LOGIN UNTUK ADMIN
app.post('/auth', function(request, response) {
    let data = request.body
	var email = data.email;
	var password = data.password;
	if (email && password) {
		db.query('SELECT * FROM admin WHERE email = ? AND password = ?', [email, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.email = data.email;
				response.redirect('/home');
			} else {
				response.send('Username dan/atau Password salah!');
			}			
			response.end();
		});
	} else {
		response.send('Masukkan Username and Password!');
		response.end();
	}
})

app.get('/home', function(request, result ) {
	if (request.session.loggedin) {
        let data = request.body
        let token = jwt.sign(data.email + '|' + data.password, secretKey)

        result.json({
            success: true,
            message: 'Selamat Datang, ' + request.session.email + '!',
            token: token
        })

    } else {
		result.json({
            success: false,
            message: 'Mohon Login Terlebih Dahulu !'
        })
	}
	result.end();
})


/* CRUD pasien **/

app.get('/pasien',  (req, res) => {
    let sql = `
        select nama_pasien, asal, umur from pasien
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "success ",
            data: result
        })
    })
})

app.post('/pasien',(req, res) => {
    let data = req.body

    let sql = `
        insert into pasien (nama_pasien, asal, umur)
        values ('`+data.nama_pasien+`', '`+data.asal+`', '`+data.umur+`')
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "data created",
            data: result
        })
    })
})

app.get('/pasien/:id_pasien',(req, res) => {
let sql = `
    select * from pasien
    where id_pasien = `+req.params.id_pasien+`
    limit 1
`

db.query(sql, (err, result) => {
    if (err) throw err

    res.json({
        message: "success get data's detail",
        data: result[0]
    })
})
})

app.put('/pasien/:id_pasien', (req, res) => {
let data = req.body

let sql = `
    update pasien
    set nama_pasien = '`+data.nama_pasen+`', asal = '`+data.asal+`', umur = '`+data.umur+`'
    where id_pasien = '`+req.params.id_pasien+`'
`
db.query(sql, (err, result) => {
    if (err) throw err

    res.json({
        message: "data has been updated",
        data: result
    })
})
})

app.delete('/pasien/:id_pasien', (req, res) => {
let sql = `
    delete from pasien
    where id_pasien = '`+req.params.id_pasien+`'
`

db.query(sql, (err, result) => {
    if (err) throw err
    
    res.json({
        message: "data has been deleted",
        data: result
    })
})
})
//transaksi
app.post('/take', (req, res) => {
    let data = req.body

    db.query(`
        insert into kamar_pasien (id_pasien, id_kamar)
        values ('`+data.id_pasien+`', '`+data.id_kamar+`')
    `, (err, result) => {
        if (err) throw err
    })

//pengurangan jmlh
    db.query(`
        update kamar
        set jumlah = jumlah - 1
        where id_kamar = '`+data.id_kamar+`'
    `, (err, result) => {
        if (err) throw err
    })

    res.json({
        message: "room has been taked by user"
    })
})

//Menampilkan data
app.get('/pasien/:id_pasien/kamar' , (req, res) => {
    db.query(`
    select kamar.nama from pasien
    right join kamar_pasien on pasien.id_pasien = kamar_pasien.id_pasien
    right join kamar on kamar_pasien.id_kamar = kamar.id_kamar
    where pasien.id_pasien = '`+req.params.id_pasien+`'
`, (err,result) => {
    if (err) throw err

        res.json({
            message: "success get room ",
            data: result
        })
    })
})

//menghapus data
app.delete('/take/:id_nama/:id_kamar', (req, res) => {
    let data = req.body

    db.query(`delete from kamar_pasien where id_nama = '`+req.params.id_nama+`'
    `
    ,(err, result) => {
        if(err) throw err
    })

//Penambahan 

db.query(`
        update kamar
        set jumlah = jumlah + 1
        where id_kamar = '`+req.params.id_kamar+`'
    `
    ,(err, result) => {
        if (err) throw err

    res.json({
        message: "room has been taked by user",
        data: result
    })
  })
})

app.listen(port, () => {
    console.log('App running on port ' + port)
})