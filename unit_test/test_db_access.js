require('dotenv').config();
const DBA = require('../db_access.js');
const colors = require('colors/safe');
const fs = require('fs');

class TestDBAccess {
    constructor(guild, role, member) {
        this.guild = guild;
        this.role = role;
        this.member = member;
    }

    print_sql(sql) {
        console.log("    " + sql.replace(/\s\s+/g, '\n    '));
    }

    async start() {
        console.log(colors.yellow("Testing DBAccess..."));
        await this.offline();
        await this.online(process.env.TEST_DATABASE_URL);
        console.log(colors.yellow("DBAccess test finished."));
    }

    async offline() {
        console.log(colors.blue("== Offline Test =="));
        DBA.set_offline(true);

        console.log(colors.black(colors.bgWhite("exec_add_role:")));
        this.print_sql(await DBA.exec_add_role(this.guild, this.role));

        console.log(colors.black(colors.bgWhite("exec_remove_role:")));
        this.print_sql(await DBA.exec_remove_role(this.guild, this.role));

        console.log(colors.black(colors.bgWhite("exec_update_current:")));
        this.print_sql(await DBA.exec_update_current(this.guild, this.role));

        console.log(colors.black(colors.bgWhite("exec_add_member:")));
        this.print_sql(await DBA.exec_add_member(this.guild, this.role, this.member, 0));

        console.log(colors.black(colors.bgWhite("exec_remove_member:")));
        this.print_sql(await DBA.exec_remove_member(this.guild, this.role, this.member));

        console.log(colors.black(colors.bgWhite("exec_update_member:")));
        this.print_sql(await DBA.exec_update_member(this.guild, this.role, this.member, 0));

        console.log(colors.black(colors.bgWhite("get_current:")));
        this.print_sql(await DBA.get_current(this.guild, this.role));

        console.log(colors.black(colors.bgWhite("get_list:")));
        this.print_sql(await DBA.get_list(this.guild, this.role));

        console.log(colors.black(colors.bgWhite("get_max_index:")));
        this.print_sql(await DBA.get_max_index(this.guild, this.role));

        console.log(colors.black(colors.bgWhite("get_min_index_of_current:")));
        this.print_sql(await DBA.get_min_index_of_current(this.guild, this.role));
    }

    async online(url) {
        console.log(colors.blue("== Online Test == "));
        console.log("DB_URL: " + colors.cyan(url));
        DBA.set_url(url);
        DBA.set_offline(false);
        await this.online_test();
    }

    async online_test() {
        try {
            await this.clean_db();
            await this.create_db();
            //await this.init_db();

            let data;
            console.log("Testing add role...");
            await DBA.exec_add_role('Guild1', 'Role1');
            data = await DBA.query("SELECT * FROM registers;");
            if (data.rowCount != 1 || data.rows[0].guild_id != 'Guild1' || data.rows[0].role_id != 'Role1') {
                console.log(data.rows);
                throw Error(colors.red("Add role failed!"));
            }
            
            console.log("Testing remove role...");
            await DBA.exec_remove_role('Guild1', 'Role1');
            data = await DBA.query("SELECT * FROM registers;");
            if (data.rowCount != 0) {
                console.log(data.rows);
                throw Error(colors.red("Remove role failed!"));
            }

            console.log("Testing add duplicated role...");
            await DBA.exec_add_role('Guild2', 'Role2');
            await DBA.exec_add_role('Guild2', 'Role2');
            data = await DBA.query("SELECT * FROM registers;");
            if (data.rowCount != 1 || data.rows[0].guild_id != 'Guild2' || data.rows[0].role_id != 'Role2') {
                console.log(data.rows);
                throw Error(colors.red("Add duplicated role failed!"));
            }
            
            console.log("Testing update current...");
            await DBA.exec_update_current('Guild2', 'Role2', 3);
            data = await DBA.query("SELECT current FROM registers WHERE guild_id = 'Guild2' AND role_id = 'Role2';");
            if (data.rowCount != 1 || data.rows[0].current != 3) {
                console.log(data.rows);
                throw Error(colors.red("Update current failed!"));
            }

            console.log("Testing add member...");
            await DBA.exec_add_member('Guild2', 'Role2', 'Member1', 0);
            data = await DBA.query("SELECT * FROM members WHERE member_id = 'Member1';");
            if (data.rowCount != 1 || data.rows[0].index != 0) {
                console.log(data.rows);
                throw Error(colors.red("Add member failed!"));
            }

            console.log("Testing more member...");
            await DBA.exec_add_member('Guild2', 'Role2', 'Member2', 1);
            await DBA.exec_add_member('Guild2', 'Role2', 'Member3', 2);
            await DBA.exec_add_member('Guild2', 'Role2', 'Member4', 3);
            data = await DBA.query("SELECT member_id FROM members ORDER BY index ASC;");
            if (data.rowCount != 4 || data.rows[0].member_id != 'Member1' || data.rows[3].member_id != 'Member4') {
                console.log(data.rows);
                throw Error(colors.red("Add more member failed!"));
            }

            console.log("Testing remove member...");
            await DBA.exec_remove_member('Guild2', 'Role2', 'Member3');
            data = await DBA.query("SELECT member_id FROM members WHERE member_id = 'Member3';");
            if (data.rowCount != 0) {
                console.log(data.rows);
                throw Error(colors.red("Remove member failed!"));
            }

            console.log("Testing get list...");
            data = await DBA.get_list('Guild2', 'Role2');
            if (data.rowCount != 3 || data.rows[0].member_id != 'Member1' || data.rows[2].member_id != 'Member4') {
                console.log(data.rows);
                throw Error(colors.red("Get list failed!"));
            }
            
            console.log("Testing get current...");
            data = await DBA.get_current('Guild2', 'Role2');
            if (data.rowCount != 1 || data.rows[0].member_id != 'Member4') {
                console.log(data.rows);
                throw Error(colors.red("Get current failed!"));
            }
            
            console.log("Testing update member...");
            await DBA.exec_update_member('Guild2', 'Role2', 'Member2', 4);
            data = await DBA.query("SELECT index FROM members WHERE member_id = 'Member2';");
            if (data.rowCount != 1 || data.rows[0].index != 4) {
                console.log(data.rows);
                throw Error(colors.red("Update member failed!"));
            }

            console.log("Testing get max index...");
            data = await DBA.get_max_index('Guild2', 'Role2');
            if (data.rowCount != 1 || data.rows[0].index != 4 || data.rows[0].member_id != 'Member2'){
                console.log(data.rows);
                throw Error(colors.red("Get max index failed!"));
            }

            console.log("Testing get min index...");
            data = await DBA.get_min_index_of_current('Guild2', 'Role2');
            if (data.rowCount != 1 || data.rows[0].index != 4 || data.rows[0].member_id != 'Member2') {
                console.log(data.rows);
                throw Error(colors.red("Get min current index failed!"));
            }
            console.log(colors.green("Online test passed!"));
        }
        catch(e) {
            console.log(colors.red("Online test failed!\n") + e);
        }
    }

    clean_db() {
        console.log("Cleaning database...");
        let cleanSQL;
        try {
            cleanSQL = fs.readFileSync(__dirname + "/../schema_clean.sql", 'utf8');
        }
        catch(e) {
            return Promise.reject(e);
        }
        return DBA.query(cleanSQL)
            .then(() => {
                console.log("Cleaning database successful.");
            })
            .catch(() => {
                console.log(colors.red("Cleaning database failed!"));
            });
    }

    create_db() {
        console.log("Creating database...");
        let createSQL
        try {
            createSQL = fs.readFileSync(__dirname + "/../schema.sql", 'utf8');
        }
        catch(e) {
            return Promise.reject(sql);
        }
        return DBA.query(createSQL)
            .then(() => {
                console.log("Creating database successful.");
            })
            .catch(() => {
                console.log(colors.red("Creating database failed!"));
            });
    }

    init_db() {
        console.log("Initializing database...");
        const sql = "INSERT INTO registers(guild_id, role_id) \
                     VALUES ('BlueBar', 'Dancer'), ('Crusaders', 'Knight')";
        return DBA.query(sql)
            .then(() => {
                console.log("Initializing database successful.");
            })
            .catch(() => {
                console.log(colors.red("Initializing database failed!"));
            });
    }
}

module.exports = new TestDBAccess("RedDragon", "Adventurer", "Denny");
