require('dotenv').config();
if (process.argv.length < 3) {
    console.log("File to be test should be passed in !");
}
else {
    const testFile = __dirname + '/test_' + process.argv[2];
    try {
        require(testFile).start()
            .then(() => {
                process.exit();
            });
    }
    catch(e) {
        console.log("Load test file for " + process.argv[2] + " [" + testFile + "] error!\n" + e);
    }
}

