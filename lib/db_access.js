const util = require('util');
const { Pool } = require('pg');
let pool = new Pool({});

module.exports = function (url) {
    return new DBAccess(url);
};

class DBAccess {
    constructor(url) {
        this.offline = false;
        pool = new Pool({
            connectionString: url,
            ssl: true
        });
    } 

    set_offline(enable) {
        this.offline = enable;
    }

    async query(sql) { //{{{
        if (this.offline) 
            return Promise.resolve(sql);

        return new Promise((resolve, reject) => {
            let data = null;

            try {
                pool.connect((err, client, release) => {
                    if (err)
                        throw Error(err.stack);
                    client.query(sql)
                        .then((result) => {
                            data = result;
                            resolve(data);
                        })
                        .catch((e) => {
                            console.error("Connection to database error. ", e.stack);
                            reject(e);
                        })
                        .then(() => {
                            release();
                        });
                });
            }
            catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }//}}}

    /* RollCaller {{{ */
    register_id_sql(guild, role) {
        let sql = "SELECT id \
                   FROM registers \
                   WHERE guild_id = '%s' AND role_id = '%s'";
        sql = util.format(sql, guild, role);
        return sql;
    }

    exec_add_role(guild, role) {
        let sql = "INSERT INTO registers (guild_id, role_id) \
                   SELECT '%s', '%s' \
                   WHERE NOT EXISTS (%s);";
        sql = util.format(sql, guild, role, this.register_id_sql(guild, role));
        return this.query(sql);
    }

    exec_remove_role(guild, role) {
        let sql = "DELETE FROM registers \
                   WHERE guild_id = '%s' AND role_id = '%s';";
        sql = util.format(sql, guild, role);
        return this.query(sql);
    }

    exec_update_current(guild, role, index) {
        let sql = "UPDATE registers \
                   SET current = %d \
                   WHERE guild_id = '%s' AND role_id = '%s';";
        sql = util.format(sql, index, guild, role);
        return this.query(sql);
    }

    exec_add_member(guild, role, member, index) {
        let sql = "INSERT INTO members(r_id, member_id, index) \
                   VALUES ((%s), '%s', %d);";
        sql = util.format(sql, this.register_id_sql(guild, role), member, index);
        return this.query(sql);
    }

    exec_remove_member(guild, role, member) {
        let sql = "DELETE FROM members \
                   WHERE r_id = (%s) AND member_id = '%s';";
        sql = util.format(sql, this.register_id_sql(guild, role), member);
        return this.query(sql);
    }

    exec_update_member(guild, role, member, index) {
        let sql = "UPDATE members \
                   SET index = %d \
                   WHERE r_id = (%s) AND member_id = '%s';";
        sql = util.format(sql, index, this.register_id_sql(guild, role), member);
        return this.query(sql);
    }

    get_role(guild, role) {
        return this.query(this.register_id_sql(guild, role) + ";");
    }

    get_role_list() {
        let sql = "SELECT R.guild_id, R.role_id, M.member_id \
                   FROM registers R, members M \
                   WHERE R.id = M.r_id AND R.current = M.index";
        return this.query(sql);
    }

    get_current(guild, role) {
        let sql = "SELECT M.member_id \
                   FROM registers R, members M \
                   WHERE R.guild_id = '%s' AND R.role_id = '%s' AND \
                         R.id = M.r_id AND R.current = M.index;";
        sql = util.format(sql, guild, role);
        return this.query(sql);
    }

    get_list(guild, role) {
        let sql = "SELECT member_id \
                   FROM members \
                   WHERE r_id = (%s) \
                   ORDER BY index ASC;";
        sql = util.format(sql, this.register_id_sql(guild, role));
        return this.query(sql);
    }

    get_max_index(guild, role) {
        let sql = "SELECT member_id, index  \
                   FROM members \
                   WHERE (r_id, index) IN ( \
                       SELECT r_id, MAX(index) \
                       FROM members \
                       WHERE r_id = (%s) \
                       GROUP BY r_id \
                   );";
        sql = util.format(sql, this.register_id_sql(guild, role));
        return this.query(sql);
    }
    
    get_min_index_of_current(guild, role) {
        let sql = "SELECT member_id, index \
                   FROM members \
                   WHERE (r_id, index) IN ( \
                       SELECT M.r_id, MIN(M.index) AS index \
                       FROM registers R, members M \
                       WHERE R.guild_id = '%s' AND R.role_id = '%s' AND \
                             R.id = M.r_id AND M.index > R.current \
                       GROUP BY M.r_id \
                   );";
        sql = util.format(sql, guild, role);
        return this.query(sql);
    }
    /* }}} */

    /* Playlist */
    setPlaylist(user, url) {
        let sql;
        return this.getPlaylist(user)
            .then(((result) => {
                if (result.rows.length == 0) {
                    sql = "INSERT INTO playlists(user_id, url) \
                           VALUES('%s', '%s')";
                    sql = util.format(sql, user, url);
                }
                else {
                    sql = "UPDATE playlists \
                           SET url = '%s' \
                           WHERE user_id = '%s'";
                    sql = util.format(sql, url, user);
                }
                return this.query(sql);
            }).bind(this))
            .catch((e) => {
                throw new Error(e);
            });
    }

    getPlaylist(user) {
        let sql = "SELECT url \
                   FROM playlists \
                   WHERE user_id = '%s'";
        sql = util.format(sql, user);
        return this.query(sql);
    }
    /* }}} */
}
