var express = require('express');
var pg = require('pg');

var sw = express();

sw.use(express.json());

sw.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    next();
});

const config = {
    host: 'localhost',
    user: 'postgres',
    //database: 'db_cs_2024', 
    database: 'DB-CS-2024', //nome do database do notebook, não compativel com o do pc do colegio
    //password: 'postgres',
    password: 'root', // senha do postgres do notebook, n é compativel com os pc do colegio
    //port: 5432
    port: 51120 // porta do notebook, nao compativel com o pc do colegio
};

const postgres = new pg.Pool(config);

sw.get('/', function (req, res) {
    res.send('Pagina root, acesse outros diretorios para conteúdo.')
})

sw.get('/listmodos', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q = 'select codigo, nome, to_char(datacriacao, \'dd/mm/yyyy hh24:mm:ss\') as datacriacao, quantboots, quantrounds from tb_modo order by codigo asc';

            client.query(q, function (err, result) {
                done(); // closing the connection;
                if (err) {
                    console.log('retornou 400 no listmodo');
                    console.log(err);

                    res.status(400).send('{' + err + '}');
                } else {

                    res.status(201).send(result.rows);
                }
            });
        }
    });
});


sw.get('/listlocais', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q = 'select nome, statuslocal from tb_local';

            client.query(q, function (err, result) {
                done(); // closing the connection;
                if (err) {
                    console.log('retornou 400 no listlocal');
                    console.log(err);

                    res.status(400).send('{' + err + '}');
                } else {

                    res.status(201).send(result.rows);
                }
            });
        }
    });
});


sw.get('/listmapas', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q = 'select m.codigo, m.nome as mapa, md.nome as modo, 0 as locais, to_char(datacadastromapa, \'dd/mm/yyyy hh24:mm:ss\')as datacadastromapa, status from tb_mapa m, tb_modo md where m.codmodo = md.codigo order by codigo asc';

            client.query(q, async function (err, result) {

                if (err) {
                    console.log('retornou 400 no listmapas');
                    console.log(err);

                    res.status(400).send('{' + err + '}');
                } else {
                    for (var i = 0; i < result.rows.length; i++) {
                        try {
                            lm = await client.query('select l.codigo, l.nome, l.statuslocal from tb_local l, tb_mapa_locais ml where ml.codlocal = l.codigo and ml.codmapa = $1', [result.rows[i].codigo])
                            result.rows[i].locais = lm.rows;
                        } catch (err) {
                            res.status(400).send('{' + err + '}');
                        }

                    }
                    res.status(201).send(result.rows);
                    done(); // closing the connection;

                }
            });
        }
    });
});

sw.post('/insertmapa', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q = {
                text: 'insert into tb_mapa(codmodo, nome, datacadastromapa, status) values ($1,$2,now(), $3) returning codmodo, nome, to_char(datacadastromapa, \'dd/mm/yyyy\') as datacadastromapa',
                values: [req.body.codmodo,
                req.body.nome,
                req.body.status == true ? "A" : "I"]
            }

            client.query(q, async function (err, result) {
                if (err) {
                    console.log('retornou 400 no insert q');
                    res.status(400).send('{' + err + '}');
                } else {
                    done(); // closing the connection;
                    console.log('retornou 201 no insertmapa');
                    res.status(201).send({
                        "nome": result.rows[0].nome,
                        "codmodo": result.rows[0].codmodo,
                        "status": result.rows[0].status,
                        "datacadastromapa": result.rows[0].datacadastromapa,
                        "locais": req.body.locais
                    });
                }
            });
        }
    });
});


sw.get('/deletemapa/:nome', (req, res) => {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados!" + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q0 = {
                text: 'delete from tb_mapa where codigo = (select min(codigo) from tb_mapa where upper(nome) = upper($1))',
                values: [req.params.nome]
            }

            var q1 = {
                text: 'delete FROM tb_mapa where nome = $1',
                values: [req.params.nome]
            }

            client.query(q0, function (err, result) {
                if (err) {
                    console.log(err);
                    res.status(400).send('{' + err + '}');

                } else {
                    client.query(q1, function (err, result) {

                        if (err) {
                            console.log(err);
                            res.status(400).send('{' + err + '}');

                        } else {
                            done() //closing connection
                            res.status(200).send({ 'nome': req.params.nome });//retorna o nickname deletado.
                        }
                    })
                }
            });
        }
    });
});


sw.post('/updatemapa', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q = {
                text: 'update tb_mapa set codmodo = $1, datacadastromapa = now(), status = $2 where lower(nome) = lower($3) returning nome, codmodo, status, to_char(datacadastromapa, \'dd/mm/yyyy hh24:mm:ss\') as datacadastromapa',
                values: [
                    req.body.codmodo,
                    req.body.status == true ? "A" : "I",
                    req.body.nome]
            }

            client.query(q, async function (err, result) {
                if (err) {
                    console.log('retornou 400 no update');
                    console.log(err)
                    res.status(400).send('{' + err + '}');
                } else {

                    try {
                        await client.query('delete from tb_mapa_locais ml where ml.codmapa = $1', [req.body.codigo])

                    } catch (err) {
                        res.status(400).send('{' + err + '}');

                    }

                    done(); // closing the connection;
                    console.log('retornou 201 no updatemapas');
                    res.status(201).send({
                        "codmodo": result.rows[0].codmodo,
                        "nome": result.rows[0].nome,
                        "status": result.rows[0].status,
                        "datacadastromapa": result.rows[0].datacadastromapa
                    });
                }
            });
        }
    });
});

sw.listen(666, function () {
    console.log('Server is running.. on Port 666');
});