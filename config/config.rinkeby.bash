now secrets rm rinkeby_mysql_host
now secrets rm rinkeby_mysql_port
now secrets rm rinkeby_mysql_database
now secrets rm rinkeby_mysql_user
now secrets rm rinkeby_mysql_password

now secrets add rinkeby_web3_provider $rinkeby_web3_provider
now secrets add rinkeby_mysql_host $rinkeby_mysql_host
now secrets add rinkeby_mysql_port $rinkeby_mysql_port
now secrets add rinkeby_mysql_database $rinkeby_mysql_database
now secrets add rinkeby_mysql_user $rinkeby_mysql_user
now secrets add rinkeby_mysql_password $rinkeby_mysql_password
