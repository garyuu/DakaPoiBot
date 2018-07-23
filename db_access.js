require('dotenv').config()
const util = require('util');
const { Client } = require('pg');
const client = new Client ({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
});

class DBAccess {
    constructor(client) {
        //this.client = client;
    }

    query(sql, callback, withResponse = false) {
        let isError = false;
        let data = null;
        client.connect();
        
        client.query(sql)
            .then((result) => {
                isError = false;
                if (withResponse)
                    data = result;
            })
            .catch((e) => {
                console.error("Connection to database error. ", e.stack);
                isError = true;
            })
            .then(() => {
                client.end();
                if (withResponse)
                    callback(isError, data);
                else
                    callback(isError);
            });
    }

    exec_register_user_to_channel(channel, user, callback) {
        let sql = "INSERT INTO channels (name) \
                   WHERE NOT EXIST(SELECT * FROM channels WHERE name = '%s'); \
                   INSERT INTO registers(channel_name, user_name) \
                   VALUES ('%s', '%s')\
                   WHERE NOT EXIST(SELECT * FROM registers WHERE channel_name = '%s' AND user_name = '%s' );";
        sql = util.format(sql, channel, channel, user, channel, user);
        this.query(sql, callback);
    }

    exec_unregister_user_from_channel(channel, user, callback) {
        let sql = "DELETE FROM registers \
                   WHERE channel_name = '%s' && user_name = '%s';";
        sql = util.format(sql, channel, user);
        this.query(sql, callback);
    }

    get_today(channel, callback) {
        let sql = "SELECT `current`, `update_time` \
                   FROM `channels` \
                   WHERE `name` = '%s'";
        sql = util.format(sql, channel);
        this.query(sql, (isError, data) => {
            if (isError) callback(isError, null);

        }, true);
    }

    get_list(channel, callback) {
        let sql = "SELECT `user_name`, `index` \
                   FROM `registers` \
                   WHERE `channel_name` = '%s' \
                   ORDER BY `index` ASC";
        this.query(sql, callback, true);
    }
}

module.exports = new DBAccess(client);
