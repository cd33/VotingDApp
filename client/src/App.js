import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Spinner, Card, Form, Button, Tab, Row, Col, ListGroup, Table } from "react-bootstrap";
import VotingContract from "./contracts/Voting.json";
import getWeb3 from "./getWeb3";
import "./App.css";

function App() {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [contract, setContract] = useState(null);
  const [voteStatus, setVoteStatus] = useState(null);
  const [whitelist, setWhitelist] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [proposal, setProposal] = useState(null);
  const [proposalErr, setProposalErr] = useState(null);
  const [addr, setAddr] = useState(null);
  const [addrErr, setAddrErr] = useState(null);

  const [ownerCheck, setOwnerCheck] = useState();
  const [resp, setResp] = useState();
  const [addressToWhitelist, setAddressToWhitelist] = useState();
  const [respSet, setRespSet] = useState();
  const [newProposal, setNewProposal] = useState();
  const [vote, setVote] = useState();
  const [transferOwnership, setTransferOwnership] = useState();
  const [renounceOwnership, setRenounceOwnership] = useState();
  const [proposalIdInput, setProposalIdInput] = useState();
  const [addressInput, setAddressInput] = useState();
  const [addressToWhitelistInput, setAddressToWhitelistInput] = useState();
  const [proposalInput, setProposalInput] = useState();
  const [voteInput, setVoteInput] = useState();
  const [transferOwnershipInput, setTransferOwnershipInput] = useState();

  useEffect(() => {
    const init = async() => {
      try {
        // Get network provider and web3 instance.
        const web3 = await getWeb3();
        // Use web3 to get the user's accounts.
        const accounts = await web3.eth.getAccounts();
  
        if (window.ethereum) {
          window.ethereum.on('accountsChanged', (accounts) => {
            setAccounts({ accounts });
            window.location.reload();
          });
  
          window.ethereum.on('chainChanged', (_chainId) => window.location.reload());
        }

        // Get the contract instance.
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = VotingContract.networks[networkId];
        const instance = new web3.eth.Contract(
          VotingContract.abi,
          deployedNetwork && deployedNetwork.address,
        );
  
        //web3.eth.handleRevert = true;
  
        setOwnerCheck(accounts[0] === await instance.methods.owner().call());

        // Set web3, accounts, and contract to the state, and then proceed with an
        // example of interacting with the contract's methods.
        setWeb3(web3);
        setAccounts(accounts);
        setContract(instance);
        // this.setState({ web3, accounts, contract: instance, ownerCheck }, this.getVoteStatus);
      } catch(error) {
        // Catch any errors for any of the above operations.
        alert(
          `Failed to load web3, accounts, or contract. Check console for details.`,
        );
        console.error(error);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (web3 !== null & contract !== null) {
      const getVoteStatus = async() => {
        const response = await contract.methods.voteStatus().call();
        switch (response) {
          case "0":
            setVoteStatus("Registering Voters");
            break;
          case "1":
            setVoteStatus("Proposals Registration Started");
            break;
          case "2":
            setVoteStatus("Proposals Registration Ended");
            break;
          case "3":
            setVoteStatus("Voting Session Started");
            break;
          case "4":
            setVoteStatus("Voting Session Ended");
            break;
          case "5":
            setVoteStatus("Votes Tallied");
            break;
          default:
            setVoteStatus(`Error: voteStatus ${response} doesn't exist.`);
            break;
        }
      }
      getVoteStatus();
    };
  }, [web3, contract]);

  useEffect(() => {
    if (contract !== null && voteStatus !== null) {
      contract.events.VoterRegistered({fromBlock: 0})
      .on('data', event => { setAddressToWhitelist(`Address ${event.returnValues.voterAddress} is now in the whitelist`) })
      .on('error', err => setAddressToWhitelist(err.message))
    
      contract.events.ProposalsRegistrationStarted({fromBlock: 0})
      .on('data', event => {
        if (voteStatus !== "Proposals Registration Started") {
          setRespSet("Proposals Registration Start")
          alert("Proposals Registration Start")
          window.location.reload();
        }
      })
      .on('error', err => setRespSet(err.message))

      contract.events.ProposalRegistered({fromBlock: 0})
      .on('data', event => { setNewProposal(`Proposal ${event.returnValues.proposalId} has been successfully saved`) })
      .on('error', err => setNewProposal(err.message))

      contract.events.ProposalsRegistrationEnded({fromBlock: 0})
      .on('data', event => {
        if (voteStatus !== "Proposals Registration Ended") {
          setRespSet("Proposals Registration End")
          alert("Proposals Registration End")
          window.location.reload();
        }
      })
      .on('error', err => setRespSet(err.message))

      contract.events.VotingSessionStarted({fromBlock: 0})
      .on('data', event => {
        if (voteStatus !== "Voting Session Started") {
          setRespSet("Voting Session Start")
          alert("Voting Session Start")
          window.location.reload();
        }
      })
      .on('error', err => setRespSet(err.message))

      contract.events.Voted({fromBlock: 0})
      .on('data', event => { setVote(`Your Vote "${event.returnValues.proposalId}" has been successfully saved`) })
      .on('error', err => setVote(err.message))

      contract.events.VotingSessionEnded({fromBlock: 0})
      .on('data', event => {
        if (voteStatus !== "Voting Session Ended") {
          setRespSet("Voting Session End")
          alert("Voting Session End")
          window.location.reload();
        }
      })
      .on('error', err => setRespSet(err.message))

      contract.events.VotesTallied({fromBlock: 0})
      .on('data', event => {
        if (voteStatus !== "Votes Tallied") {
          setRespSet("The votes have been successfully counted")
          alert("The votes have been successfully counted")
          window.location.reload();
        }
      })
      .on('error', err => setRespSet(err.message))

      contract.events.WorkflowStatusChange({fromBlock: 0})
      .on('data', event => {
        console.log(event.returnValues);
      })
      .on('error', err => console.error(err))
    }
  }, [contract, voteStatus])

  // ********************* GET FUNCTIONS *********************

  const getOwner = async() => { setResp(await contract.methods.owner().call()) }

  const getWhitelist = async() => { setWhitelist(await contract.methods.getWhitelist().call()) }

  const getProposals = async() => { setProposals(await contract.methods.getProposals().call()) }

  const getWinningProposalId = async() => {
    setResp(`The winning proposal is the number ${await contract.methods.winningProposalId().call()}`);
  }

  const getProposalById = async() => {
    try { setProposal(await contract.methods.proposals(proposalIdInput.value).call()) }
    catch(error) { setProposalErr(error.message) }
  }

  const getVoterByAddress = async() => {
    try { setAddr(await contract.methods.voters(addressInput.value).call()) } 
    catch(error) { setAddrErr(error.message) }
  }

  // ********************* SET FUNCTIONS *********************

  const addToWhitelist = async() => {
    try { await contract.methods.addToWhitelist(addressToWhitelistInput.value).send({ from: accounts[0] }) } 
    catch(error) { setAddressToWhitelist(error.message) }
  }

  const proposalsRegistrationStart = async() => {
    try { await contract.methods.proposalsRegistrationStart().send({ from: accounts[0] }) }
    catch(error) { setRespSet(error.message) }
  }

  const proposalsRegistration = async() => {
    try { await contract.methods.proposalsRegistration(proposalInput.value).send({ from: accounts[0] }) } 
    catch(error) { setNewProposal(error.message) }
  }

  const proposalsRegistrationEnd = async() => {
    try { await contract.methods.proposalsRegistrationEnd().send({ from: accounts[0] }) } 
    catch(error) { setRespSet(error.message) }
  }

  const votingSessionStart = async() => {
    try { await contract.methods.votingSessionStart().send({ from: accounts[0] }); } 
    catch(error) { setRespSet(error.message); }
  }

  const handleVote = async() => {
    try { await contract.methods.vote(voteInput.value).send({ from: accounts[0] }) } 
    catch(error) { setVote(error.message) }
  }

  const votingSessionEnd = async() => {
    try { await contract.methods.votingSessionEnd().send({ from: accounts[0] }) } 
    catch(error) { setRespSet(error.message) }
  }

  const votesTally = async() => {
    try { await contract.methods.votesTally().send({ from: accounts[0] }) } 
    catch(error) { setRespSet(error.message) }
  }

  // ********************* OWNER FUNCTIONS *********************

  const handleTransferOwnership = async() => {
    try {
      await contract.methods.transferOwnership(transferOwnershipInput.value).send({ from: accounts[0] })
      setTransferOwnership(`${transferOwnershipInput.value} is the new owner`);
      alert(`${transferOwnershipInput.value} is the new owner`);
      window.location.reload();
    } catch(error) {
      setTransferOwnership(error.message);
    }
  }

  const handleRenounceOwnership = async() => {
    try {
      await contract.methods.renounceOwnership().send({ from: accounts[0] });
      setRenounceOwnership("You are not owner anymore");
      alert("You are not owner anymore");
      window.location.reload();
    } catch(error) {
      setRenounceOwnership(error.message);
    }
  }

  // ********************************************************** FRONT **************************************************

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
                      <ListGroup.Item action href="#link1" onClick={getOwner}>Owner</ListGroup.Item>
                      <ListGroup.Item action href="#link2" onClick={getWhitelist}>Whitelist</ListGroup.Item>
                      <ListGroup.Item action href="#link3" onClick={getProposals}>Proposals List</ListGroup.Item>
                      <ListGroup.Item action href="#link4">Vote Status</ListGroup.Item>
                      { voteStatus === "Votes Tallied" &&
                        <ListGroup.Item action href="#link5" onClick={getWinningProposalId}>Winning Proposal</ListGroup.Item>
                      }

                      <ListGroup.Item action href="#link6" onClick={() => setProposal(null)} >
                        <Form.Group style={{display: 'flex'}} >
                          <Form.Control placeholder="Get Proposal by ID" type="text" id="proposalIdInput" ref={input => setProposalIdInput(input)}/>
                          <Button onClick={getProposalById} variant="info" style={{color:'white'}}>Ok</Button>
                        </Form.Group>
                      </ListGroup.Item>
                      
                      <ListGroup.Item action href="#link7" onClick={() => setAddr(null)} >
                        <Form.Group style={{display: 'flex'}} >
                          <Form.Control placeholder="Get Voter by address" type="text" id="addressInput" ref={input => setAddressInput(input)}/>
                          <Button onClick={getVoterByAddress} variant="info" style={{color:'white'}}>Ok</Button>
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
                                    <th>Proposal number {proposalIdInput.value}</th>
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
                                    <th>Address {addressInput.value}</th>
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
                          <ListGroup.Item action href="#link1" onClick={() => setAddressToWhitelist("")} >
                            <Form.Group style={{display: 'flex'}} >
                              <Form.Control placeholder="Add To Whitelist" type="text" id="addressToWhitelistInput" ref={input => setAddressToWhitelistInput(input)}/>
                              <Button onClick={addToWhitelist} variant="danger" style={{color:'white'}}>Ok</Button>
                            </Form.Group>
                          </ListGroup.Item>

                          <ListGroup.Item action href="#link2" onClick={proposalsRegistrationStart}>Proposals Registration Start</ListGroup.Item>
                        </>}

                        { voteStatus === "Proposals Registration Started" && <>
                          <ListGroup.Item action href="#link3" onClick={() => setNewProposal("")} >
                            <Form.Group style={{display: 'flex'}} >
                              <Form.Control placeholder="Proposals Registration" type="text" id="proposalInput" ref={input => setProposalInput(input)}/>
                              <Button onClick={proposalsRegistration} variant="danger" style={{color:'white'}}>Ok</Button>
                            </Form.Group>
                          </ListGroup.Item>
                        { ownerCheck &&
                          <ListGroup.Item action href="#link4" onClick={proposalsRegistrationEnd}>Proposals Registration End</ListGroup.Item>
                        }</>}

                        { voteStatus === "Proposals Registration Ended" &&
                          <ListGroup.Item action href="#link5" onClick={votingSessionStart}>Voting Session Start</ListGroup.Item>
                        }

                        { voteStatus === "Voting Session Started" && <>
                          <ListGroup.Item action href="#link6" onClick={() => setVote("")} >
                            <Form.Group style={{display: 'flex'}} >
                              <Form.Control placeholder="Vote" type="text" id="voteInput" ref={input => setVoteInput(input)} />
                              <Button onClick={handleVote} variant="danger" style={{color:'white'}}>Ok</Button>
                            </Form.Group>
                          </ListGroup.Item>
                          { ownerCheck &&
                            <ListGroup.Item action href="#link7" onClick={votingSessionEnd}>Voting Session End</ListGroup.Item>
                          }</>}

                        { voteStatus === "Voting Session Ended" &&
                          <ListGroup.Item action href="#link8" onClick={votesTally}>Votes Tally</ListGroup.Item>
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
                            <Form.Control placeholder="Transfer Ownership" type="text" id="transferOwnershipInput" ref={input => setTransferOwnershipInput(input)} />
                            <Button onClick={handleTransferOwnership} variant="warning" style={{color:'white'}}>Ok</Button>
                          </Form.Group>
                        </ListGroup.Item>

                        <ListGroup.Item action href="#link2" onClick={handleRenounceOwnership}>Renounce Ownership</ListGroup.Item>
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
export default App;