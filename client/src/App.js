import React, { Component } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Spinner, Card, Form, Button, Tab, Row, Col, ListGroup, Table } from "react-bootstrap";
import VotingContract from "./contracts/Voting.json";
import getWeb3 from "./getWeb3";
import "./App.css";

class App extends Component {
  state = {
    web3: null,
    accounts: null,
    contract: null,
    voteStatus: null,
    whitelist: [],
    proposals: [],
    proposal: null,
    proposalErr: null,
    addr: null,
    addrErr: null,
  };

  componentDidMount = async() => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();
      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = VotingContract.networks[networkId];
      const instance = new web3.eth.Contract(
        VotingContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      const ownerCheck = accounts[0] === await instance.methods.owner().call();

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance, ownerCheck }, this.getVoteStatus);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  // ********************* GET FUNCTIONS *********************

  getOwner = async() => {
    this.setState({ resp: await this.state.contract.methods.owner().call() });
  }

  getWhitelist = async() => {
    this.setState({ whitelist: await this.state.contract.methods.getWhitelist().call() });
  }

  getProposals = async() => {
    this.setState({ proposals: await this.state.contract.methods.getProposals().call() });
  }

  getVoteStatus = async() => {
    const response = await this.state.contract.methods.voteStatus().call();
    switch (response) {
      case "0":
        this.setState({ voteStatus: "Registering Voters"});
        break;
      case "1":
        this.setState({ voteStatus: "Proposals Registration Started"});
        break;
      case "2":
        this.setState({ voteStatus: "Proposals Registration Ended"});
        break;
      case "3":
        this.setState({ voteStatus: "Voting Session Started"});
        break;
      case "4":
        this.setState({ voteStatus: "Voting Session Ended"});
        break;
      case "5":
        this.setState({ voteStatus: "Votes Tallied"});
        break;
      default:
        this.setState({ voteStatus: `Error: voteStatus ${response} doesn't exist.`});
        break;
    }
  }

  getWinningProposalId = async() => {
    this.setState({ resp: `The winning proposal is the number ${await this.state.contract.methods.winningProposalId().call()}`});
  }

  getProposalById = async() => {
    try {
      this.setState({ proposal: await this.state.contract.methods.proposals(this.proposalIdInput.value).call() });
    } catch (error) {
      this.setState({ proposalErr: error.message });
    }
  }

  getVoterByAddress = async() => {
    try {
      this.setState({ addr: await this.state.contract.methods.voters(this.addressInput.value).call() });
    } catch (error) {
      this.setState({ addrErr: error.message });
    }
  }

  // ********************* SET FUNCTIONS *********************

  addToWhitelist = async() => {
    const address = this.addressToWhitelistInput.value;
    try {
      await this.state.contract.methods.addToWhitelist(address).send({ from: this.state.accounts[0] });
      this.setState({ addressToWhitelist: `Address ${address} is now in the whitelist`});
    } catch (error) {
      this.setState({ addressToWhitelist: error.message });
    }
  }
  
  proposalsRegistrationStart = async() => {
    try {
      await this.state.contract.methods.proposalsRegistrationStart().send({ from: this.state.accounts[0] });
      this.setState({ respSet: "Proposals Registration Start"});
    } catch (error) {
      this.setState({ respSet: error.message });
    }
  }

  proposalsRegistration = async() => {
    const proposalInput = this.proposalInput.value;
    try {
      await this.state.contract.methods.proposalsRegistration(proposalInput).send({ from: this.state.accounts[0] });
      this.setState({ newProposal: `Proposal ${proposalInput} has been successfully saved`});
    } catch (error) {
      this.setState({ newProposal: error.message });
    }
  }

  proposalsRegistrationEnd = async() => {
    try {
      await this.state.contract.methods.proposalsRegistrationEnd().send({ from: this.state.accounts[0] });
      this.setState({ respSet: "Proposals Registration End" });
    } catch (error) {
      this.setState({ respSet: error.message });
    }
  }

  votingSessionStart = async() => {
    try {
      await this.state.contract.methods.votingSessionStart().send({ from: this.state.accounts[0] });
      this.setState({ respSet: "Voting Session Start" });
    } catch (error) {
      this.setState({ respSet: error.message });
    }
  }

  vote = async() => {
    const voteInput = this.voteInput.value;
    try {
      await this.state.contract.methods.vote(voteInput).send({ from: this.state.accounts[0] });
      this.setState({ vote: `Your Vote "${voteInput}" has been successfully saved` });
    } catch (error) {
      this.setState({ vote: error.message });
    }
  }

  votingSessionEnd = async() => {
    try {
      await this.state.contract.methods.votingSessionEnd().send({ from: this.state.accounts[0] });
      this.setState({ respSet: "Voting Session End" });
    } catch (error) {
      this.setState({ respSet: error.message });
    }
  }

  votesTally = async() => {
    try {
      await this.state.contract.methods.votesTally().send({ from: this.state.accounts[0] });
      this.setState({ respSet: "The votes have been successfully counted" });
    } catch (error) {
      this.setState({ respSet: error.message });
    }
  }

  // ********************* OWNER FUNCTIONS *********************

  transferOwnership = async() => {
    const transferOwnershipInput = this.transferOwnershipInput.value;
    try {
      await this.state.contract.methods.transferOwnership(transferOwnershipInput).send({ from: this.state.accounts[0] });
      this.setState({ transferOwnership: `${transferOwnershipInput} is the new owner` });
    } catch (error) {
      this.setState({ transferOwnership: error.message });
    }
  }

  renounceOwnership = async() => {
    try {
      await this.state.contract.methods.renounceOwnership().send({ from: this.state.accounts[0] });
      this.setState({ renounceOwnership: "You are not owner anymore" });
    } catch (error) {
      this.setState({ renounceOwnership: error.message });
    }
  }

  render() {
    const { 
      web3,
      ownerCheck,
      voteStatus,
      resp,
      whitelist,
      proposals,
      proposal,
      proposalErr,
      addr,
      addrErr,
      addressToWhitelist,
      respSet,
      newProposal,
      vote,
      transferOwnership,
      renounceOwnership 
    } = this.state;

    console.log(this.state.transferOwnership)
    console.log(this.state.renounceOwnership)

    if (!web3) 
      return (
        <div className="App"style={{marginTop: 50}}>
          <Spinner animation="border" variant="dark" style={{marginBottom: 20}} />
          <h3>Loading Web3, accounts, and contract...</h3>
        </div>
      )
    return (
      <div className="App">
        <div style={{textAlign: "center"}}>
          <h1>Voting DApp</h1>
          <hr/>
        </div>

        {/* ********************* GET FUNCTIONS ********************* */}

        <div style={{display: 'flex', justifyContent: 'center'}}>
          <Card style={{ width: '50rem'}} bg="info" text='light'>
            <Card.Header><strong>List of GET functions</strong></Card.Header>
              <Card.Body>
              <Tab.Container>
                <Row>
                  <Col sm={5}>
                    <ListGroup>
                      <ListGroup.Item action href="#link1" onClick={this.getOwner}>Owner</ListGroup.Item>
                      <ListGroup.Item action href="#link2" onClick={this.getWhitelist}>Whitelist</ListGroup.Item>
                      <ListGroup.Item action href="#link3" onClick={this.getProposals}>Proposals List</ListGroup.Item>
                      <ListGroup.Item action href="#link4" onClick={this.getVoteStatus}>Vote Status</ListGroup.Item>
                      { voteStatus === "Votes Tallied" &&
                        <ListGroup.Item action href="#link5" onClick={this.getWinningProposalId}>Winning Proposal</ListGroup.Item>
                      }

                      <ListGroup.Item action href="#link6">
                        <Form.Group style={{display: 'flex'}} >
                          <Form.Control placeholder="Get Proposal by ID" type="text" id="proposalIdInput" ref={(input) => {this.proposalIdInput = input}}/>
                          <Button onClick={this.getProposalById} variant="info" style={{color:'white'}}>Ok</Button>
                        </Form.Group>
                      </ListGroup.Item>
                      
                      <ListGroup.Item action href="#link7">
                        <Form.Group style={{display: 'flex'}} >
                          <Form.Control placeholder="Get Voter by address" type="text" id="addressInput" ref={(input) => {this.addressInput = input}}/>
                          <Button onClick={this.getVoterByAddress} variant="info" style={{color:'white'}}>Ok</Button>
                        </Form.Group>
                      </ListGroup.Item>
                    </ListGroup>
                  </Col>

                  <Col sm={7} style={{alignSelf: "center"}}>
                    <Tab.Content>
                      <Tab.Pane eventKey="#link1" style={{fontSize: 20}}>{resp}</Tab.Pane>

                      <Tab.Pane eventKey="#link2">
                        <ListGroup variant="flush">
                          <ListGroup.Item style={{padding: 0}} >
                            <Table style={{marginBottom: 0}}>
                              <thead>
                                <tr>
                                  <th>Whitelist</th>
                                </tr>
                              </thead>
                              <tbody>
                                {whitelist.length ?
                                  whitelist.map((add, index) => <tr key={index}><td>{index} : {add}</td></tr>)
                                  : <tr><td>There is no address yet</td></tr>
                                }
                              </tbody>
                            </Table>
                          </ListGroup.Item>
                        </ListGroup>
                      </Tab.Pane>

                      <Tab.Pane eventKey="#link3">
                        <ListGroup variant="flush">
                          <ListGroup.Item style={{padding: 0}} >
                            <Table style={{marginBottom: 0}}>
                              <thead>
                                <tr>
                                  <th>Proposals List</th>
                                </tr>
                              </thead>
                              <tbody>
                                {proposals.length ?
                                  proposals.map((prop, index) => <tr key={index}><td>Proposal {index} : {prop.description} - voteCount: {prop.voteCount}</td></tr>)
                                  : <tr><td>There is no proposal yet</td></tr>
                                }
                              </tbody>
                            </Table>
                          </ListGroup.Item>
                        </ListGroup>
                      </Tab.Pane>

                      <Tab.Pane eventKey="#link4" style={{fontSize: 20}}>{voteStatus}</Tab.Pane>

                      <Tab.Pane eventKey="#link5" style={{fontSize: 20}}>{resp}</Tab.Pane>

                      <Tab.Pane eventKey="#link6">
                        {proposal !== null ?
                          <ListGroup variant="flush">
                            <ListGroup.Item style={{padding: 0}} >
                              <Table style={{marginBottom: 0}}>
                                <thead>
                                  <tr>
                                    <th>Proposal number {this.proposalIdInput.value}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr><td>Description: {proposal[0]}</td></tr>
                                  <tr><td>VoteCount: {proposal[1]}</td></tr>
                                </tbody>
                              </Table>
                            </ListGroup.Item>
                          </ListGroup>
                        : proposalErr }
                      </Tab.Pane>

                      <Tab.Pane eventKey="#link7">
                        {addr !== null ?
                          <ListGroup variant="flush">
                            <ListGroup.Item style={{padding: 0}} >
                              <Table style={{marginBottom: 0}}>
                                <thead>
                                  <tr>
                                    <th>Address {this.addressInput.value}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr><td>isRegistered: {addr[0] ? "True" : "False"}</td></tr>
                                  <tr><td>HasVoted: {addr[1] ? "True" : "False"}</td></tr>
                                  <tr><td>proposalsCount: {addr[2]}</td></tr>
                                  <tr><td>votedProposalId: {addr[3]}</td></tr>
                                </tbody>
                              </Table>
                            </ListGroup.Item>
                          </ListGroup>
                        : addrErr }
                      </Tab.Pane>
                    </Tab.Content>
                  </Col>
                </Row>
              </Tab.Container>
            </Card.Body>
          </Card>
        </div>

        {/* ********************* SET FUNCTIONS ********************* */}
        
        { ((ownerCheck && voteStatus !== "Votes Tallied") || voteStatus === "Proposals Registration Started" || voteStatus === "Voting Session Started") && 
          <div style={{display: 'flex', justifyContent: 'center', margin: 50}}>
            <Card style={{ width: '50rem'}} bg="danger" text='light'>
              <Card.Header><strong>List of SET functions</strong></Card.Header>
                <Card.Body>
                <Tab.Container>
                  <Row>
                    <Col sm={5}>
                      <ListGroup>
                        { voteStatus === "Registering Voters" && <>
                          <ListGroup.Item action href="#link1">
                            <Form.Group style={{display: 'flex'}} >
                              <Form.Control placeholder="Add To Whitelist" type="text" id="addressToWhitelistInput" ref={(input) => {this.addressToWhitelistInput = input}}/>
                              <Button onClick={this.addToWhitelist} variant="danger" style={{color:'white'}}>Ok</Button>
                            </Form.Group>
                          </ListGroup.Item>

                          <ListGroup.Item action href="#link2" onClick={this.proposalsRegistrationStart}>Proposals Registration Start</ListGroup.Item>
                        </>}

                        { voteStatus === "Proposals Registration Started" && <>
                          <ListGroup.Item action href="#link3">
                            <Form.Group style={{display: 'flex'}} >
                              <Form.Control placeholder="Proposals Registration" type="text" id="proposalInput" ref={(input) => {this.proposalInput = input}}/>
                              <Button onClick={this.proposalsRegistration} variant="danger" style={{color:'white'}}>Ok</Button>
                            </Form.Group>
                          </ListGroup.Item>
                        { ownerCheck &&
                          <ListGroup.Item action href="#link4" onClick={this.proposalsRegistrationEnd}>Proposals Registration End</ListGroup.Item>
                        }</>}

                        { voteStatus === "Proposals Registration Ended" &&
                          <ListGroup.Item action href="#link5" onClick={this.votingSessionStart}>Voting Session Start</ListGroup.Item>
                        }

                        { voteStatus === "Voting Session Started" && <>
                          <ListGroup.Item action href="#link6">
                            <Form.Group style={{display: 'flex'}} >
                              <Form.Control placeholder="Vote" type="text" id="voteInput" ref={(input) => {this.voteInput = input}}/>
                              <Button onClick={this.vote} variant="danger" style={{color:'white'}}>Ok</Button>
                            </Form.Group>
                          </ListGroup.Item>
                          { ownerCheck &&
                            <ListGroup.Item action href="#link7" onClick={this.votingSessionEnd}>Voting Session End</ListGroup.Item>
                          }</>}

                        { voteStatus === "Voting Session Ended" &&
                          <ListGroup.Item action href="#link8" onClick={this.votesTally}>Votes Tally</ListGroup.Item>
                        }
                      </ListGroup>
                    </Col>

                    <Col sm={7} style={{alignSelf: "center"}}>
                      <Tab.Content>
                        <Tab.Pane eventKey="#link1" style={{fontSize: 20}}>{ addressToWhitelist }</Tab.Pane>
                        <Tab.Pane eventKey="#link2" style={{fontSize: 20}}>{ respSet }</Tab.Pane>
                        <Tab.Pane eventKey="#link3" style={{fontSize: 20}}>{ newProposal }</Tab.Pane>
                        <Tab.Pane eventKey="#link4" style={{fontSize: 20}}>{ respSet }</Tab.Pane>
                        <Tab.Pane eventKey="#link5" style={{fontSize: 20}}>{ respSet }</Tab.Pane>
                        <Tab.Pane eventKey="#link6" style={{fontSize: 20}}>{ vote }</Tab.Pane>
                        <Tab.Pane eventKey="#link7" style={{fontSize: 20}}>{ respSet }</Tab.Pane>
                        <Tab.Pane eventKey="#link8" style={{fontSize: 20}}>{ respSet }</Tab.Pane>
                      </Tab.Content>
                    </Col>
                  </Row>
                </Tab.Container>
              </Card.Body>
            </Card>
          </div>
        }

        {/* ********************* OWNER FUNCTIONS ********************* */}

        { ownerCheck && 
          <div style={{display: 'flex', justifyContent: 'center', margin: 50}}>
            <Card style={{ width: '50rem'}} bg="warning" text='light'>
              <Card.Header><strong>List of OWNER functions</strong></Card.Header>
                <Card.Body>
                <Tab.Container>
                  <Row>
                    <Col sm={5}>
                      <ListGroup>
                        <ListGroup.Item action href="#link1">
                          <Form.Group style={{display: 'flex'}} >
                            <Form.Control placeholder="Transfer Ownership" type="text" id="transferOwnershipInput" ref={(input) => {this.transferOwnershipInput = input}}/>
                            <Button onClick={this.transferOwnership} variant="warning" style={{color:'white'}}>Ok</Button>
                          </Form.Group>
                        </ListGroup.Item>

                        <ListGroup.Item action href="#link2" onClick={this.renounceOwnership}>Renounce Ownership</ListGroup.Item>
                      </ListGroup>
                    </Col>

                    <Col sm={7} style={{alignSelf: "center"}}>
                      <Tab.Content>
                        <Tab.Pane eventKey="#link1" style={{fontSize: 20}}>{ transferOwnership }</Tab.Pane>
                        <Tab.Pane eventKey="#link2" style={{fontSize: 20}}>{ renounceOwnership }</Tab.Pane>
                      </Tab.Content>
                    </Col>
                  </Row>
                </Tab.Container>
              </Card.Body>
            </Card>
          </div>
        }
      </div>
    );
  }
}

export default App;