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

            var q = 'select codigo, nome, statuslocal from tb_local';

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

sw.post('/insertlocal', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q1 = {
                text: 'insert into tb_local(nome, statuslocal) values ($1, $2) returning codigo, nome, statuslocal;',
                values: [req.body.nome,
                req.body.statuslocal]
            }

            console.log("q1 passou");

            client.query(q1, function (err, result1) {
                if (err) {
                    console.log('retornou 400 no insert q1');
                    res.status(400).send('{' + err + '}');
                } else {
                    done(); // closing the connection;
                    console.log('retornou 201 no insertendereco');
                    res.status(201).send({
                        "nome": result1.rows[0].nome,
                        "statuslocal": result1.rows[0].statuslocal,
                    });
                }
            });
        }
    });
});

sw.get('/deletelocal/:codigo', (req, res) => {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q = {
                text: 'delete from tb_local where codigo = $1',
                values: [req.params.codigo],

            }

            console.log("q1 passou");

            client.query(q, function (err, result) {
                if (err) {
                    console.log('retornou 400 no delete q');
                    res.status(400).send('{' + err + '}');
                } else {
                    done(); // closing the connection;
                    console.log('retornou 201 no deletelocal');
                    res.status(200).send({ 'codigo': req.params.codigo })
                }
            });
        }
    });
});

sw.post('/updatelocal', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q = {
                text: 'update tb_local set nome = $1, statuslocal = $2 where codigo = $3 returning nome, statuslocal, codigo',
                values: [req.body.nome,
                req.body.statuslocal,
                req.body.codigo]
            }

            console.log("q1 passou");

            client.query(q, function (err, result) {
                if (err) {
                    console.log('retornou 400 no insert q1');
                    res.status(400).send('{' + err + '}');
                } else {
                    done(); // closing the connection;
                    console.log('retornou 201 no updatelocal');
                    res.status(201).send({
                        "nome": result.rows[0].nome,
                        "statuslocal": result.rows[0].statuslocal,
                        "codigo": result.rows[0].codigo
                    });
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
            var q = 'select m.codigo, m.nome, to_char(m.datacadastromapa, \'dd/mm/yyyy\') as datacadastromapa, m.status, m.codmodo as modo, 0 as locais from tb_mapa m order by m.codigo asc';

            client.query(q, async function (err, result) {

                if (err) {
                    console.log('retornou 400 no listjogadores');
                    console.log(err);
                    res.status(400).send('{' + err + '}');
                } else {
                    for (var i = 0; i < result.rows.length; i++) {
                        try { //Exercicio 2: incluir todas as colunas de tb_patente.                         
                            lc = await client.query('select codlocal as codigo from ' +
                                'tb_mapa_locais ' +
                                'where codmapa = $1',
                                [result.rows[i].codigo])
                            result.rows[i].locais = lc.rows;

                            pe = await client.query('select md.codigo, md.nome from tb_mapa m, ' +
                                'tb_modo md ' +
                                'where  m.codmodo=md.codigo and md.codigo = $1',
                                [result.rows[i].modo])

                            result.rows[i].modo = pe.rows[0];

                        } catch (err) {
                            res.status(400).send('{' + err + '}');
                        }
                    }
                    done(); // closing the connection;
                    //console.log('retornou 201 no /listendereco');                    
                    res.status(201).send(result.rows);
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
            console.log(req.body.status)
            var q1 = {
                text: 'insert into tb_mapa (nome, datacadastromapa, status, codmodo) '
                    + ' values ($1, now(), $2, $3) returning codigo, nome, to_char(datacadastromapa, \'dd/mm/yyyy hh24:mi:ss\') as datacadastromapa, status, 0 as locais',
                values: [req.body.nome, req.body.status, req.body.modo.codigo]
            }
            client.query(q1, async function (err, result1) {
                if (err) {
                    console.log('retornou 400 no insert q1 para insertmapa');
                    res.status(400).send('{' + err + '}');
                } else {
                    result1.rows[0].locais = []
                    for (var i = 0; i < req.body.locais.length; i++) {
                        try { //Exercicio 2: incluir todas as colunas de tb_patente.                         
                            pj = await client.query('insert into tb_mapa_locais (codmapa, codlocal) values ($1, $2) returning codmapa, codlocal',
                                [result1.rows[0].codigo, req.body.locais[i].codigo]
                            )

                            result1.rows[0].locais.push(pj.rows)

                        } catch (error) {
                            console.log('retornou 400 no insert for em tb_mapa_locais');
                            console.log(error)
                            res.status(400).send('{' + error + '}');
                        }
                    }


                    console.log('retornou 201 no insertmapa');

                    res.status(201).send({
                        "codigo": result1.rows[0].codigo,
                        "nome": result1.rows[0].nome,
                        "datacadastromapa": result1.rows[0].datacadastromapa,
                        "status": result1.rows[0].status,
                        "locais": result1.rows[0].locais
                    });
                }
            });

        }
    });
});


sw.get('/deletemapa/:codigo', (req, res) => {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados!" + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q0 = {
                text: 'delete FROM tb_mapa_locais where codmapa = $1',
                values: [req.params.codigo]
            }

            var q1 = {
                text: 'delete FROM tb_mapa where codigo = $1',
                values: [req.params.codigo]
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

                            res.status(200).send({ 'codigo': req.params.codigo });//retorna o nickname deletado.

                        }
                    });

                }

            });

        }
        done();
    });
});


sw.post('/updatemapa', function (req, res, next) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send('{' + err + '}');
        } else {
            console.log(req.body.status)
            var q1 = {
                text: 'update tb_mapa set nome = $1, status = $2, codmodo = $3 where codigo = $4 returning codigo, nome, codmodo as modo, (select nome from tb_modo where codigo = tb_mapa.codmodo) as modo_nome, to_char(datacadastromapa, \'dd/mm/yyyy hh24:mi:ss\') as datacadastromapa, status, 0 as locais ',
                values: [req.body.nome, (req.body.status == true ? "A" : "I"), req.body.modo.codigo, req.body.codigo]
            }
            client.query(q1, async function (err, result1) {
                if (err) {
                    console.log('retornou 400 no update q1 para updatemapa');
                    res.status(400).send('{' + err + '}');
                } else {

                    var q2 = {
                        text: 'delete from tb_mapa_locais where codmapa = $1;',
                        values: [req.body.codigo]
                    }
                    client.query(q2, async function (err, result2) {
                        if (err) {
                            console.log('retornou 400 no update q2 para updatemapa');
                            res.status(400).send('{' + err + '}');
                        } else {

                            locais = []
                            for (var i = 0; i < req.body.locais.length; i++) {
                                try { //Exercicio 2: incluir todas as colunas de tb_patente. , (select nome from tb_local where codigo = tb_mapa_locais.codlocal) as nome, (select statuslocal from tb_local where codigo = tb_mapa_locais.codlocal) as statuslocal                         
                                    pj = await client.query('insert into tb_mapa_locais (codmapa, codlocal) values ($1, $2) returning codlocal as codigo',
                                        [result1.rows[0].codigo, req.body.locais[i].codigo]
                                    )

                                    locais.push(pj.rows[0])

                                } catch (error) {
                                    console.log('retornou 400 no insert for em tb_mapa_locais');
                                    console.log(error)
                                    res.status(400).send('{' + error + '}');
                                }
                            }

                            console.log('retornou 201 no updatemapa');

                            res.status(201).send({
                                "codigo": result1.rows[0].codigo,
                                "nome": result1.rows[0].nome,
                                "datacadastromapa": result1.rows[0].datacadastromapa,
                                "status": result1.rows[0].status,
                                "locais": locais,
                                "modo": { "codigo": result1.rows[0].modo, "nome": result1.rows[0].modo_nome }
                            });

                        }
                    });

                }
            });

        }
    });
});
sw.get('/listpatentes', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q = 'select codigo, nome, quant_min_pontos, to_char(datacriacao, \'dd/mm/yyyy\') as datacriacao, cor, logotipo from tb_patente order by codigo asc';

            client.query(q, function (err, result) {
                done(); // closing the connection;
                if (err) {
                    console.log('retornou 400 no listpatente');
                    console.log(err);

                    res.status(400).send('{' + err + '}');
                } else {

                    //console.log('retornou 201 no /listendereco');
                    res.status(201).send(result.rows);
                }
            });
        }
    });
});
sw.post('/updatepatentes', function (req, res, next) {

    postgres.connect(function (err, client, done) {
        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q1 = {
                text: "update tb_patente set nome=$1, quant_min_pontos=$2, cor=$3, logotipo=$4 where tb_patente.codigo=$5 returning codigo, nome, quant_min_pontos, to_char(datacriacao, \'dd/mm/yyyy hh24:mm:ss\') as datacriacao, cor, logotipo",

                values: [req.body.nome,
                req.body.quant_min_pontos,
                req.body.cor, req.body.logotipo, req.body.codigo]
            }
            console.log(q1)

            client.query(q1, function (err, result1) {
                if (err) {
                    console.log('retornou 400 no update q1');
                    res.status(400).send('{' + err + '}');
                } else {
                    console.log('retornou 201 no updatepatente');
                    res.status(201).send({
                        "codigo": result1.rows[0].codigo, "nome": result1.rows[0].nome,
                        "quant_min_pontos": result1.rows[0].quant_min_pontos,
                        "cor": result1.rows[0].cor,
                        "datacriacao": result1.rows[0].datacriacao,
                        "logotipo": result1.rows[0].logotipo
                    });
                }

            })

        }
    })
});

sw.get('/deletepatentes/:codigo', function (req, res, next) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados!" + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q = {
                text: 'delete FROM tb_patente where codigo = $1',
                values: [req.params.codigo]
            }
        }
        client.query(q, function (err, result) {
            
            if (err) {
                console.log(err);
                res.status(400).send('{' + err + '}');
            } else {
                res.status(200).send({ 'codigo': req.params.codigo})
            }
        })
    });
});

sw.get('/listjogador', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q = "select nickname,senha,quantpontos,quantdinheiro,to_char(datacadastro, 'dd/mm/yyyy hh24:mi:ss') " +
                "as datacadastro,to_char(data_ultimo_login, 'dd/mm/yyyy hh24:mi:ss') as data_ultimo_login,situacao," +
                " 0 as patentes, 0 as endereco from tb_jogador j order by nickname asc"

            client.query(q, async function (err, result) {
                if (err) {

                    res.status(400).send('{' + err + '}');
                } else {

                    for (var i = 0; i < result.rows.length; i++) {
                        try {
                            pj = await client.query('select codpatente from'
                                + ' tb_jogador_conquista_patente '
                                + 'where nickname = $1', [result.rows[i].nickname])
                            result.rows[i].patentes = pj.rows;
                        } catch (err) {
                            res.status(400).send('{' + err + '}')
                        }

                    };

                    for (var i = 0; i < result.rows.length; i++) {
                        try {
                            ej = await client.query('select * from'
                                + ' tb_endereco '
                                + 'where nicknamejogador = $1', [result.rows[i].nickname])
                            result.rows[i].endereco = ej.rows;
                        } catch (err) {

                            res.status(400).send('{' + err + '}')
                        }
                    };
                    done(); // closing the connection;
                    res.status(201).send(result.rows);
                }
            });
        }
    });
});


sw.get('/listjogador/:nickname', function (req, res) { // NÃO PRECISA DOS ":" NO INSOMNIA!!!!! ELES CAUSAM ERRO!!!! SO COLOCA O NICKNAME DPS DA BARRA!!!!

    //estabelece uma conexao com o bd.
    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Não conseguiu acessar o BD :" + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q = {
                text: 'select j.nickname, j.senha, j.quantpontos, j.quantdinheiro, to_char(j.datacadastro, \'dd/mm/yyyy\') as datacadastro, to_char(j.data_ultimo_login, \'dd/mm/yyyy\') as data_ultimo_login, j.situacao, e.cep, e.complemento, e.codigo, 0 as patentes from tb_jogador j left join tb_endereco e on (j.nickname=e.nicknamejogador) where nickname = $1 order by j.datacadastro asc;',
                values: [req.params.nickname]
            } // query com o endereço incluido já

            var q2 = {
                text: 'select p.codigo, p.nome from tb_patente p, tb_jogador_conquista_patente jp where jp.codpatente=p.codigo and jp.nickname = $1',
                values: [req.params.nickname] // pega todas as patentes relacionadas ao nickname
            }

            client.query(q, async function (err, result) { //testa se retorna no select de jogador e endereco para nickname
                //done(); // closing the connection;
                if (err) {
                    console.log(err);
                    res.status(500).send('{' + err + '}');
                } else {

                    client.query(q2, async function (err, result1) { //testa se pegou todas as patentes do nickname

                        if (err) {
                            console.log(err);
                            res.status(500).send('{' + err + '}');
                        } else {

                            done();  // closing the connection;                    
                            res.status(200).send({
                                "nickname": result.rows[0].nickname,
                                "senha": result.rows[0].senha,
                                "quantpontos": result.rows[0].quantpontos,
                                "quantdinheiro": result.rows[0].quantdinheiro,
                                "situacao": result.rows[0].situacao,
                                "datacadastro": result.rows[0].datacadastro,
                                "data_ultimo_login": result.rows[0].data_ultimo_login,
                                "endereco": { "codigo": result.rows[0].codigo, "cep": result.rows[0].cep, "complemento": result.rows[0].complemento }, //mostra o endereco daquele nickname que só pode ter 1, vem como objeto
                                "patentes": result1.rows //mostra todas as patentes daquele nickname, é um array de objetos
                            });

                        }
                    });

                }

            });
        }
    });
});

sw.post('/insertjogador', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q1 = {
                text: 'insert into tb_jogador (nickname, senha, quantpontos, quantdinheiro, datacadastro, data_ultimo_login, situacao) values ($1,$2,$3,$4, now(), now(), $5) returning nickname, senha, quantpontos, quantdinheiro, to_char(datacadastro, \'dd/mm/yyyy\') as datacadastro, to_char(data_ultimo_login, \'dd/mm/yyyy\') as data_ultimo_login, situacao;',
                values: [req.body.nickname,
                req.body.senha,
                req.body.quantpontos,
                req.body.quantdinheiro,
                req.body.situacao === "A" ? "A" : "I"]
            }
            var q2 = {
                text: 'insert into tb_endereco (complemento, cep, nicknamejogador) values ($1, $2, $3) returning codigo, complemento, cep;',
                values: [req.body.endereco.complemento,
                req.body.endereco.cep,
                req.body.nickname]
            }

            console.log("q1 passou");

            client.query(q1, function (err, result1) {
                if (err) {
                    console.log('retornou 400 no insert q1');
                    res.status(400).send('{' + err + '}');
                } else {


                    client.query(q2, async function (err, result2) {
                        if (err) {
                            console.log('retornou 400 no insert q2');
                            res.status(400).send('{' + err + '}');
                        } else {
                            console.log("q2 passou");
                            //insere todas as pantentes na tabela associativa.
                            for (var i = 0; i < req.body.patentes.length; i++) {

                                try {
                                    pj = await client.query('insert into tb_jogador_conquista_patente (codpatente, nickname) values ($1, $2)', [req.body.patentes[i].codigo, req.body.nickname])

                                } catch (err) {

                                    res.status(400).send('{' + err + '}');
                                }

                            }

                            done(); // closing the connection;
                            console.log('retornou 201 no insertjogador');
                            res.status(201).send({
                                "nickname": result1.rows[0].nickname,
                                "senha": result1.rows[0].senha,
                                "quantpontos": result1.rows[0].quantpontos,
                                "quantdinheiro": result1.rows[0].quantdinheiro,
                                "situacao": result1.rows[0].situacao,
                                "datacadastro": result1.rows[0].datacadastro,
                                "data_ultimo_login": result1.rows[0].data_ultimo_login,
                                "endereco": { "codigo": result2.rows[0].codigo, "cep": result2.rows[0].cep, "complemento": result2.rows[0].complemento },
                                "patentes": req.body.patentes
                            });
                        }
                    });
                }
            });
        }
    });
});

sw.post('/updatejogador', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q1 = {
                text: 'update tb_jogador set senha = $1, quantPontos = $2, quantdinheiro = $3, situacao = $4 where nickname = $5 ' +
                    'returning nickname, senha, quantpontos, quantdinheiro, to_char(datacadastro, \'dd/mm/yyyy\') as datacadastro, situacao;',
                values: [
                    req.body.senha,
                    req.body.quantpontos,
                    req.body.quantdinheiro,
                    req.body.situacao === "A" ? "A" : "I",
                    req.body.nickname] // faz update em todos os parametros menos no nome, usando ele de parametro de filtragem
            }
            var q2 = {
                text: 'update tb_endereco set complemento = $1, cep = $2 where nicknamejogador = $3 returning codigo, complemento, cep;',
                values: [req.body.endereco.complemento,
                req.body.endereco.cep,
                req.body.nickname]// faz update em todos os campos e usa o nickname que é a chave estrangeira para filtrar
            }
            console.log(q1);
            console.log(q2);

            client.query(q1, function (err, result1) {
                if (err) {
                    console.log('retornou 400 no update');
                    console.log(err)
                    res.status(400).send('{' + err + '}');
                } else {
                    client.query(q2, async function (err, result2) {
                        if (err) {
                            console.log(err);
                            console.log('retornou 400 no updatejogador');
                            res.status(400).send('{' + err + '}');
                        } else {


                            try {
                                //remove todas as patentes
                                await client.query('delete from tb_jogador_conquista_patente jp where jp.nickname = $1', [req.body.nickname]) // deleta tudo para colocar manualmente as patentes

                                //insere todas as pantentes na tabela associativa.
                                for (var i = 0; i < req.body.patentes.length; i++) {

                                    try {

                                        await client.query('insert into tb_jogador_conquista_patente (codpatente, nickname) values ($1, $2)', [req.body.patentes[i].codigo, req.body.nickname]) //insere as patentes pelo codigo colocados no JSON do body do insomnia

                                    } catch (err) {

                                        res.status(400).send('{' + err + '}');
                                    }

                                }

                            } catch (err) {

                                res.status(400).send('{' + err + '}');
                            }

                            done(); // closing the connection;

                            console.log('retornou 201 no updatejogador');
                            res.status(201).send({
                                "nickname": result1.rows[0].nickname,
                                "senha": result1.rows[0].senha,
                                "quantpontos": result1.rows[0].quantpontos,
                                "quantdinheiro": result1.rows[0].quantdinheiro,
                                "situacao": result1.rows[0].situacao,
                                "datacadastro": result1.rows[0].datacadastro,
                                "data_ultimo_login": result1.rows[0].data_ultimo_login,
                                "endereco": { "codigo": result2.rows[0].codigo, "cep": result2.rows[0].cep, "complemento": result2.rows[0].complemento },
                                "patentes": req.body.patentes
                            });
                        }
                    });
                }
            });
        }
    });
});

sw.get('/deletejogador/:nickname', (req, res) => {  // NÃO PRECISA DOS ":" NO INSOMNIA!!!!! ELES CAUSAM ERRO!!!! SO COLOCA O NICKNAME DPS DA BARRA!!!!

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados!" + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q0 = {
                text: 'delete FROM tb_jogador_conquista_patente where nickname = $1',
                values: [req.params.nickname] // deleta tudo do nickname da associativa entre jogador e patente primeiro
            }

            var q1 = {
                text: 'delete FROM tb_endereco where nicknamejogador = $1',
                values: [req.params.nickname] // deleta todos os enderecos do nickname
            }
            var q2 = {
                text: 'delete FROM tb_jogador where nickname = $1',
                values: [req.params.nickname] // deleta tudo do nickname do jogador
            }

            client.query(q0, function (err, result) { // testa se deletou da associativa

                if (err) {
                    console.log(err);
                    res.status(400).send('{' + err + '}');
                } else {

                    client.query(q1, function (err, result) { // testa se deletou do endereco

                        if (err) {
                            console.log(err);
                            res.status(400).send('{' + err + '}');
                        } else {
                            client.query(q2, function (err, result) { // testa se deletou de jogador
                                done();// closing the connection;
                                if (err) {
                                    console.log(err);
                                    res.status(400).send('{' + err + '}');
                                } else {
                                    res.status(200).send({ 'nickname': req.params.nickname });//retorna o nickname deletado.
                                }
                            })
                        }
                    });


                }

            });


        }
    });
});

sw.get('/listendereco', function (req, res) {

    //estabelece uma conexao 'com o bd.
    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Não conseguiu acessar o BD :" + err);
            res.status(400).send('{' + err + '}');
        } else {


            client.query('select codigo, complemento, cep, nicknamejogador, 0 as jogador from tb_endereco ', async function (err, result) {
                //done(); // closing the connection;
                if (err) {
                    console.log(err);
                    res.status(400).send('{' + err + '}');
                } else {

                    for (var i = 0; i < result.rows.length; i++) {

                        try {

                            jo = await client.query('select * from'
                                + ' tb_jogador '
                                + 'where nickname = $1', [result.rows[i].nicknamejogador])
                            result.rows[i].jogador = jo.rows;

                        } catch (err) {

                            res.status(400).send('{' + err + '}');
                        }

                    }

                    done();  // closing the connection;
                    res.status(200).send(result.rows);
                }

            });
        }
    });
});

sw.post('/insertendereco', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q1 = {
                text: 'insert into tb_endereco (complemento, cep, nicknamejogador) values ($1, $2, $3) returning codigo, complemento, cep, nicknamejogador;',
                values: [req.body.complemento,
                req.body.cep,
                req.body.nicknamejogador]
            }

            console.log("q1 passou");

            client.query(q1, function (err, result1) {
                if (err) {
                    console.log('retornou 400 no insert q1');
                    res.status(400).send('{' + err + '}');
                } else {
                    done(); // closing the connection;
                    console.log('retornou 201 no insertendereco');
                    res.status(201).send({
                        "complemento": result1.rows[0].complemento,
                        "cep": result1.rows[0].cep,
                        "nicknamejogador": result1.rows[0].nicknamejogador
                    });
                }
            });
        }
    });
});

sw.post('/updateendereco', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q = {
                text: 'update tb_endereco set complemento = $1, cep = $2 where nicknamejogador = $3 returning complemento, cep, nicknamejogador',
                values: [req.body.complemento,
                req.body.cep,
                req.body.nicknamejogador]
            }

            console.log("q1 passou");

            client.query(q, function (err, result) {
                if (err) {
                    console.log('retornou 400 no insert q1');
                    res.status(400).send('{' + err + '}');
                } else {
                    done(); // closing the connection;
                    console.log('retornou 201 no updateendereco');
                    res.status(201).send({
                        "complemento": result.rows[0].complemento,
                        "cep": result.rows[0].cep,
                        "nicknamejogador": result.rows[0].nicknamejogador
                    });
                }
            });
        }
    });
});

sw.get('/deleteendereco/:codigo', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q = {
                text: 'delete from tb_endereco where codigo = $1',
                values: [req.params.codigo],

            }

            console.log("q1 passou");

            client.query(q, function (err, result) {
                if (err) {
                    console.log('retornou 400 no delete q');
                    res.status(400).send('{' + err + '}');
                } else {
                    done(); // closing the connection;
                    console.log('retornou 201 no deleteendereco');
                    res.status(200).send({ 'codigo': req.params.codigo })
                }
            });
        }
    });
});


sw.listen(4000, function () {
    console.log('Server is running.. on Port 4000 q funfa no notebook');
});