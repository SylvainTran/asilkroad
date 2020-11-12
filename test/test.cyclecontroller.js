// TITLE: Tests for cycle controller
// AUTHOR: Sylvain Tran
// DATE: v0.1-pre-alpha on 12-10-2020
// GOAL: For the semester project in Cart 351
// DESCRIPTION: Unit tests for the cycle controller

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');

const Server = require('../routes/3-timers_sockets.io_basics');
Server.CYCLE_UTC_DATE = new Date();
const testCycleSettings = {
    startDay: Server.CYCLE_UTC_DATE.getUTCDate(),
    startMonth: Server.CYCLE_UTC_DATE.getUTCMonth(),
    startYear: Server.CYCLE_UTC_DATE.getUTCFullYear(),
    cycleTotalDuration: 100,
    cycleGenerationDuration: 10,
    cycleTick: "hourly",
    cycleType: "hoursToYears"
};

console.log("Unit tests start for: ");
console.log(Server.Server.Model);

// TESTS:
//
// RETURN CYCLE MODEL
describe('The values for Cycle Total Duration', function() {
    it('should not be undefined', function() {
        expect(Server.Server.Model.CycleSettings(testCycleSettings).getCycleTotalDuration()).to.not.equal('undefined');
    });
    it('should not be equal to 0', function() {
        expect(Server.Server.Model.CycleSettings(testCycleSettings).getCycleTotalDuration()).to.not.equal(0);
    });
    it('should not be equal to null', function() {
        expect(Server.Server.Model.CycleSettings(testCycleSettings).getCycleTotalDuration()).to.not.equal(null);
    });
    it('should not be equal to NaN', function() {
        expect(Number.isNaN(Server.Server.Model.CycleSettings(testCycleSettings).getCycleTotalDuration())).to.not.equal(true);
    });
});
describe('The checkpoints getter calculation', function() {
    it('should not be undefined', function(){
        expect(Server.Server.Model.CycleSettings(testCycleSettings).getCycleCheckPoints()).to.not.equal('undefined');
    });
});
describe('The values used for cycle generation duration', function() {
    it('should not be equal to undefined', function() {
        expect(Server.Server.Model.CycleSettings(testCycleSettings).getCycleGenerationDuration()).to.not.equal('undefined');
    });
    it('should not be equal to 0', function() {
        expect(Server.Server.Model.CycleSettings(testCycleSettings).getCycleGenerationDuration()).to.not.equal(0);
    });
    it('should not be equal to null', function() {
        expect(Server.Server.Model.CycleSettings(testCycleSettings).getCycleGenerationDuration()).to.not.equal(null);
    });
    it('should not be equal to NaN', function() {
        expect(Number.isNaN(Server.Server.Model.CycleSettings(testCycleSettings).getCycleGenerationDuration())).to.not.equal(true);
    });
});

let clock;
describe('loopCycleEvents', function() {    
    beforeEach(function() {
      clock = sinon.useFakeTimers();
    });

    afterEach(function() {
      clock = sinon.restore();
    });

    // it('should increase tick counter by one after each interval passed', function(){
    //   // Test Object: The server's model
    //   const ServerModelCycleSettings = Server.Server.Model.CycleSettings(testCycleSettings).CycleSettings();
    //   Server.Server.LogicController.CycleEvents(ServerModelCycleSettings).loopCycleEvents();
    //   clock.tick(20000);
    //   console.log(Server.Server.LogicController.CycleEvents(ServerModelCycleSettings));
    //   setTimeout( expect(Server.Server.LogicController.CycleEvents(ServerModelCycleSettings).getTickCount().to.equal(10)), 20001);
    // });
});