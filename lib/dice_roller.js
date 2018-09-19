class DiceRoller {
    randbm() {
		let u = 0, v = 0;
		while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
		while(v === 0) v = Math.random();
		let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
        return num;
    }

    rollSimple(n) {
        return Math.floor(Math.random() * n) + 1;
    }

	roll(n, k) {
		if (n.length > 2 || k.length > 5) {
			return this.fakeRoll(Number(n), Number(k))
		}
		else {
            let val = 0;
            for (let j = 0; j < n; j++) {
                val += this.rollSimple(k);
            }
            return String(val);
        }
	}

    fakeRoll(n, k) {
		const sigma = Math.sqrt(parseFloat(n) * (k ^ 2 - 1) / 12);
		const mu = parseFloat(n) * (1 + k) / 2;
        const limit = n * k;
        console.log(sigma + " " + mu);
		let result = 0;
		while (result < 1 || result > limit) {
            let rand = this.randbm();
            console.log(rand);
			result = Math.round(rand * sigma + mu);
            console.log(result);
		}
        return result;
    }
}

module.exports = new DiceRoller();
