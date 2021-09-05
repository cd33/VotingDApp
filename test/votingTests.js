const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const Voting = artifacts.require("Voting");

contract('Voting', accounts => {
    const owner = accounts[0];
    const voter1 = accounts[1];
    const voter2 = accounts[2];
    const voter3 = accounts[3];
    const proposal1 = "Prop 1";
    const proposal2 = "Prop 2";
    const proposal3 = "Prop 3";
    const vote1 = new BN(0);
    const vote2 = new BN(1);
    const RegisteringVoters = new BN(0);
    const ProposalsRegistrationStarted = new BN(1);
    const ProposalsRegistrationEnded = new BN(2);
    const VotingSessionStarted = new BN(3);
    const VotingSessionEnded = new BN(4);

    describe("Voting DApp", function() {
        beforeEach(async function () {
            this.VotingInstance = await Voting.new();
        });

        describe("Init", function() {
            it("Owner check", async function () {
                expect(await this.VotingInstance.owner()).to.equal(owner);
            });

            it("RegisteringVoters check", async function() {
                expect(await this.VotingInstance.voteStatus()).to.be.bignumber.equal(RegisteringVoters);
            });
        });

        describe("First Step", function() {
            it("REVERT: addToWhitelist() is onlyOwner", async function() {
                await expectRevert(this.VotingInstance.addToWhitelist(voter1, {from:voter1}),
                "Ownable: caller is not the owner");
            })

            it("Owner add a voter in the whitelist", async function() {
                await this.VotingInstance.addToWhitelist(voter1, {from:owner});
                const voterInfo = await this.VotingInstance.voters(voter1);
                expect(voterInfo.isRegistered).to.be.true;
            });

            it("EVENT: VoterRegistered", async function() {
                expectEvent(await this.VotingInstance.addToWhitelist(
                    voter1, {from:owner}), "VoterRegistered", {voterAddress: voter1}
                );
            });

            it("REVERT: ER2: The voter already exist.", async function() {
                await this.VotingInstance.addToWhitelist(voter1, {from:owner});
                await expectRevert(this.VotingInstance.addToWhitelist(voter1, {from:owner}), "ER2");
            });
        });

        describe("Second Step", function() {
            it("REVERT: proposalsRegistrationStart() is onlyOwner", async function() {
                await expectRevert(this.VotingInstance.proposalsRegistrationStart({from:voter1}),
                "Ownable: caller is not the owner");
            });

            it("ProposalsRegistrationStarted", async function() {
                await this.VotingInstance.proposalsRegistrationStart({from:owner});
                expect(await this.VotingInstance.voteStatus()).to.be.bignumber.equal(ProposalsRegistrationStarted);
            });

            it("EVENT: ProposalsRegistrationStarted", async function() {
                expectEvent(await this.VotingInstance.proposalsRegistrationStart({from:owner}), "ProposalsRegistrationStarted");
            });

            it("EVENT: WorkflowStatusChange", async function() {
                expectEvent(await this.VotingInstance.proposalsRegistrationStart({from:owner}),
                "WorkflowStatusChange", {previousStatus: new BN(0), newStatus: new BN(1)});
            });

            it("REVERT: ER1: The vote has already started.", async function() {
                await this.VotingInstance.proposalsRegistrationStart({from:owner});
                await expectRevert(this.VotingInstance.addToWhitelist(voter1, {from:owner}), "ER1");
            });

            it("REVERT: ER3 : You're not allowed to vote.", async function() {
                await this.VotingInstance.addToWhitelist(voter1, {from:owner});
                await this.VotingInstance.addToWhitelist(voter2, {from:owner});
                await this.VotingInstance.addToWhitelist(voter3, {from:owner});
                await this.VotingInstance.proposalsRegistrationStart({from:owner});
                await expectRevert(this.VotingInstance.proposalsRegistration(proposal1, {from:owner}), "ER3");
            })

            it("Voters add propositions", async function() {
                await this.VotingInstance.addToWhitelist(voter1, {from:owner});
                await this.VotingInstance.addToWhitelist(voter2, {from:owner});
                await this.VotingInstance.addToWhitelist(voter3, {from:owner});
                await this.VotingInstance.proposalsRegistrationStart({from:owner});
                await this.VotingInstance.proposalsRegistration(proposal1, {from:voter1});
                await this.VotingInstance.proposalsRegistration(proposal2, {from:voter2});
                await this.VotingInstance.proposalsRegistration(proposal3, {from:voter3});
                let proposals = await this.VotingInstance.getProposals();
                expect(proposals[0].description).to.equal(proposal1);
                expect(proposals[1].description).to.equal(proposal2);
                expect(proposals[2].description).to.equal(proposal3);
            });

            it("EVENT: ProposalRegistered", async function() {
                await this.VotingInstance.addToWhitelist(voter1, {from:owner});
                await this.VotingInstance.addToWhitelist(voter2, {from:owner});
                await this.VotingInstance.addToWhitelist(voter3, {from:owner});
                await this.VotingInstance.proposalsRegistrationStart({from:owner});
                expectEvent(await this.VotingInstance.proposalsRegistration(proposal1, {from:voter1}),
                "ProposalRegistered", {proposalId: new BN(0)});
            });

            it("REVERT: ER4 : Registration has not yet started or is already ended.", async function() {
                await this.VotingInstance.addToWhitelist(voter1, {from:owner});
                await expectRevert(this.VotingInstance.proposalsRegistration(proposal1, {from:voter1}), "ER4");
            });

            it("REVERT: ER5 : The number of proposals per voter is limited to 100.", async function() {
                await this.VotingInstance.addToWhitelist(voter1, {from:owner});
                await this.VotingInstance.proposalsRegistrationStart({from:owner});
                for (i = 0; i<100; i++) {
                    await this.VotingInstance.proposalsRegistration(`proposal ${i}`, {from:voter1});
                }
                await expectRevert(this.VotingInstance.proposalsRegistration(proposal1, {from:voter1}), "ER5");
            })
        });

        describe("Third Step", function() {
            beforeEach(async function () {
                await this.VotingInstance.addToWhitelist(voter1, {from:owner});
                await this.VotingInstance.addToWhitelist(voter2, {from:owner});
                await this.VotingInstance.addToWhitelist(voter3, {from:owner});
                await this.VotingInstance.proposalsRegistrationStart({from:owner});
                await this.VotingInstance.proposalsRegistration(proposal1, {from:voter1});
                await this.VotingInstance.proposalsRegistration(proposal2, {from:voter2});
                await this.VotingInstance.proposalsRegistration(proposal3, {from:voter3});
            });

            it("REVERT: proposalsRegistrationEnd() is onlyOwner", async function() {
                await expectRevert(this.VotingInstance.proposalsRegistrationEnd({from:voter1}),
                "Ownable: caller is not the owner");
            });

            it("ProposalsRegistrationEnded", async function() {
                await this.VotingInstance.proposalsRegistrationEnd({from:owner});
                expect(await this.VotingInstance.voteStatus()).to.be.bignumber.equal(ProposalsRegistrationEnded);
            });

            it("EVENT: ProposalsRegistrationEnded", async function() {
                expectEvent(await this.VotingInstance.proposalsRegistrationEnd({from:owner}), "ProposalsRegistrationEnded");
            });

            it("REVERT: ER6 : Registration has to be started", async function() {
                await this.VotingInstance.proposalsRegistrationEnd({from:owner});
                await expectRevert(this.VotingInstance.proposalsRegistrationEnd({from:owner}), "ER6");
            });

            it("REVERT: ER1: The vote has already started.", async function() {
                await this.VotingInstance.proposalsRegistrationEnd({from:owner});
                await expectRevert(this.VotingInstance.proposalsRegistrationStart({from:owner}), "ER1");
            });

            it("REVERT: votingSessionStart() is onlyOwner", async function() {
                await this.VotingInstance.proposalsRegistrationEnd({from:owner});
                await expectRevert(this.VotingInstance.votingSessionStart({from:voter1}),
                "Ownable: caller is not the owner");
            });

            it("VotingSessionStarted", async function() {
                await this.VotingInstance.proposalsRegistrationEnd({from:owner});
                await this.VotingInstance.votingSessionStart({from:owner});
                expect(await this.VotingInstance.voteStatus()).to.be.bignumber.equal(VotingSessionStarted);
            });

            it("EVENT: VotingSessionStarted", async function() {
                await this.VotingInstance.proposalsRegistrationEnd({from:owner});
                expectEvent(await this.VotingInstance.votingSessionStart({from:owner}), "VotingSessionStarted");
            });

            it("REVERT: ER7 : Registration has to be ended.", async function() {
                await expectRevert(this.VotingInstance.votingSessionStart({from:owner}), "ER7");
            });
        });

        describe("Fourth step", function() {
            beforeEach(async function () {
                await this.VotingInstance.addToWhitelist(voter1, {from:owner});
                await this.VotingInstance.addToWhitelist(voter2, {from:owner});
                await this.VotingInstance.addToWhitelist(voter3, {from:owner});
                await this.VotingInstance.proposalsRegistrationStart({from:owner});
                await this.VotingInstance.proposalsRegistration(proposal1, {from:voter1});
                await this.VotingInstance.proposalsRegistration(proposal2, {from:voter2});
                await this.VotingInstance.proposalsRegistration(proposal3, {from:voter3});
                await this.VotingInstance.proposalsRegistrationEnd({from:owner});
                await this.VotingInstance.votingSessionStart({from:owner});
            });

            it("REVERT: ER3 : You're not allowed to vote.", async function() {
                await expectRevert(this.VotingInstance.vote(vote1, {from:owner}), "ER3");
            });

            it("Voters vote", async function() {
                await this.VotingInstance.vote(vote1, {from:voter1});
                await this.VotingInstance.vote(vote1, {from:voter2});
                await this.VotingInstance.vote(vote2, {from:voter3});
                const v1 = await this.VotingInstance.voters(voter1)
                const v2 = await this.VotingInstance.voters(voter2)
                const v3 = await this.VotingInstance.voters(voter3)
                expect(v1.votedProposalId).to.be.bignumber.equal(vote1);
                expect(v2.votedProposalId).to.be.bignumber.equal(vote1);
                expect(v3.votedProposalId).to.be.bignumber.equal(vote2);
            });

            it("EVENT: Voted", async function() {
                expectEvent(await this.VotingInstance.vote(vote1, {from:voter1}),
                "Voted", {voter: voter1, proposalId: new BN(0)});
            });

            it("REVERT: ER8 : You have already voted.", async function() {
                await this.VotingInstance.vote(vote1, {from:voter1});
                await expectRevert(this.VotingInstance.vote(vote2, {from:voter1}), "ER8");
            });

            it("REVERT: ER9 : Non-existent proposal.", async function() {
                await expectRevert(this.VotingInstance.vote(new BN(5), {from:voter1}), "ER9");
            });
        });

        describe("Ultimate Step", function() {
            beforeEach(async function () {
                await this.VotingInstance.addToWhitelist(owner, {from:owner});
                await this.VotingInstance.addToWhitelist(voter1, {from:owner});
                await this.VotingInstance.addToWhitelist(voter2, {from:owner});
                await this.VotingInstance.addToWhitelist(voter3, {from:owner});
                await this.VotingInstance.proposalsRegistrationStart({from:owner});
                await this.VotingInstance.proposalsRegistration(proposal1, {from:voter1});
                await this.VotingInstance.proposalsRegistration(proposal2, {from:voter2});
                await this.VotingInstance.proposalsRegistration(proposal3, {from:voter3});
                await this.VotingInstance.proposalsRegistrationEnd({from:owner});
                await this.VotingInstance.votingSessionStart({from:owner});
                await this.VotingInstance.vote(vote1, {from:voter1});
                await this.VotingInstance.vote(vote2, {from:voter2});
                await this.VotingInstance.vote(vote2, {from:voter3});
            });

            it("REVERT: votingSessionEnd() is onlyOwner", async function() {
                await expectRevert(this.VotingInstance.votingSessionEnd({from:voter1}),
                "Ownable: caller is not the owner");
            });

            it("VotingSessionEnded", async function() {
                await this.VotingInstance.votingSessionEnd({from:owner});
                expect(await this.VotingInstance.voteStatus()).to.be.bignumber.equal(VotingSessionEnded);
            });

            it("EVENT: VotingSessionEnded", async function() {
                expectEvent(await this.VotingInstance.votingSessionEnd({from:owner}), "VotingSessionEnded");
            });

            it("REVERT: ER10 : The voting session has to be started.", async function() {
                await this.VotingInstance.votingSessionEnd({from:owner});
                await expectRevert(this.VotingInstance.vote(vote1, {from:owner}), "ER10");
            });
            
            it("REVERT: ER10 : The voting session has to be started.", async function() {
                await this.VotingInstance.votingSessionEnd({from:owner});
                await expectRevert(this.VotingInstance.votingSessionEnd({from:owner}), "ER10");
            });

            it("REVERT: ER11 : The voting session has to be ended.", async function() {
                await expectRevert(this.VotingInstance.votesTally({from:owner}), "ER11");
            });
        });

        describe("Winner", function() {
            beforeEach(async function () {
                await this.VotingInstance.addToWhitelist(voter1, {from:owner});
                await this.VotingInstance.addToWhitelist(voter2, {from:owner});
                await this.VotingInstance.addToWhitelist(voter3, {from:owner});
                await this.VotingInstance.proposalsRegistrationStart({from:owner});
                await this.VotingInstance.proposalsRegistration(proposal1, {from:voter1});
                await this.VotingInstance.proposalsRegistration(proposal2, {from:voter2});
                await this.VotingInstance.proposalsRegistration(proposal3, {from:voter3});
                await this.VotingInstance.proposalsRegistrationEnd({from:owner});
                await this.VotingInstance.votingSessionStart({from:owner});
                await this.VotingInstance.vote(vote1, {from:voter1});
                await this.VotingInstance.vote(vote2, {from:voter2});
                await this.VotingInstance.vote(vote2, {from:voter3});
                await this.VotingInstance.votingSessionEnd({from:owner});
            });

            it("REVERT: votesTally() is onlyOwner", async function() {
                await expectRevert(this.VotingInstance.votesTally({from:voter1}),
                "Ownable: caller is not the owner");
            });

            it("WinningProposalId Check", async function() {
                await this.VotingInstance.votesTally({from:owner});
                expect(await this.VotingInstance.winningProposalId()).to.be.bignumber.equal(vote2);
            });

            it("EVENT: VotesTallied", async function() {
                expectEvent(await this.VotingInstance.votesTally({from:owner}), "VotesTallied");
            });
        });
    });
});