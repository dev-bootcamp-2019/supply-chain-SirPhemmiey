const SupplyChain = artifacts.require('SupplyChain');

contract("Supply chain test", async(accounts) => {

    const femi = accounts[0];
    const seun = accounts[1];
    const mike = accounts[2];
    const emptyAddress = '0x0000000000000000000000000000000000000000'

    var sku;
    const price = web3.toWei(1, "ether");

    it("should add an item", async() => {
        const supplyChain = await SupplyChain.deployed();
        var eventEmitted = false;
        const event = supplyChain.ForSale();
        await event.watch((err, res) => {
            sku = res.args.sku.toString(10);
            eventEmitted = true;
        });

        const name = "book";
        await supplyChain.addItem(name, price, {from: femi});
        const result = await supplyChain.fetchItem.call(sku);
        assert.equal(result[0], name, "the name of the last item added does not match the expected value");
    });

    it("should allow purchase of an item", async() => {
        const supplyChain = await SupplyChain.deployed();
        var eventEmitted = false;
        const event = supplyChain.Sold();
        const amount = web3.toWei(2, "ether");
        const femiBeforeBalance = await web3.eth.getBalance(femi).toNumber();
        const seunBeforeBalance = await web3.eth.getBalance(seun).toNumber();
        await event.watch((err, res) => {
            sku = res.args.sku.toString(10);
            eventEmitted = true;
        });

        await supplyChain.buyItem(sku, {from: seun, value: amount});

        const femiAfterBalance = await web3.eth.getBalance(femi).toNumber();
        const seunAfterBalance = await web3.eth.getBalance(seun).toNumber();
        const result = await supplyChain.fetchItem.call(sku);

        assert.equal(result[3].toString(10), 1, "The state of the item should be Sold");
        assert.equal(eventEmitted, true, "It must emit an event");
    });

    it("should allow seller to mark item as shipped", async() => {
        const supplyChain = await SupplyChain.deployed();
        var eventEmitted = false;
        const event = supplyChain.Shipped();
        await event.watch((err, res) => {
            sku = res.args.sku.toString();
            eventEmitted = true;
        });
        await supplyChain.shipItem(sku, {from: femi});
        const result = await supplyChain.fetchItem.call(sku);
        assert.equal(eventEmitted, true, "Event must be marked as shipped");
        assert.equal(result[3].toString(10), 2, "the state of the item must be shippd")
    });

    it("should allow the buyer to mark item as received", async() => {
        const supplyChain = await SupplyChain.deployed();
        var eventEmitted = false;
        const event = supplyChain.Received();
        await event.watch((err, res) => {
            sku = res.args.sku.toString();
            eventEmitted = true;
        });
        await supplyChain.receiveItem(sku, {from: seun});
        const result = await supplyChain.fetchItem.call(sku);
        assert.equal(eventEmitted, true, "it must emit an event to mark it as received");
        assert.equal(result[3].toString(10), 2, "item should be marked shipped");
    });
});