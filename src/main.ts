import './style.css'
import { setupConnect } from './connect'
import { setupSubmit } from './submit'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<header>
  <h1>Snakepath</h1>
  <div class="logo">
  <div id="by"><h4>by &nbsp</h4></div>
  <img src="fortress.svg" alt="Fortress Labs" style="height:3.75em;">
  </h4>
  </div>
  
  <h6>Sample Application:<br>Privacy-Preserving Onchain Credit Scoring</h6>
  <p>
    Snakepath is a privacy-preserving interoperability protocol.
    It enables public chain applications to call arbitrary functions on private 
    compute chains while preserving the privacy of the inputs and validity of 
    the outputs. This sample application is meant to be a very crude demonstration 
    of this functionality. For further details about Snakepath, please visit 
    fortresslabs.xyz/snakepath.
  </p>
  <p>
    In this sample app, a contract on Ethereum Goerli Testnet manages a private 
    credit scoring contract on a privacy-preserving network (Secret Network Testnet). 
    User data is encrypted, signed by the user's Ethereum address, sent in ciphertext 
    via the Snakepath relayer to be computed over privately, with the result returned 
    and outputted below.
  </p>
  <p><b>
    Note: The inputs chosen and scoring weights are for demonstration purposes only. 
    This is merely meant to be a Proof of Concept.
  </b></p>
  <p>
    Step 1: Connect your Ethereum wallet and navigate to the Goerli testnet. (Metamask only)
  </p>
  <p>
    Step 2: Input sample data below. (In a production flow, this encrypted data packet 
    would contain the public signature of a trusted offchain data provider. For the 
    purposes of this sample application, feel free to input arbitrary data.)
  </p>
  <p>
    Step 3: Sign transaction
  </p>
</header>
  <div>
    <div id="form">
      <div id="wallet">
      </div>
      <form name="inputForm">    
        <div class="card">
        <button id="connect" type="button"></button>
        </div>
      <label for="input1">$USD value of offchain assets:  </label>
      <input type="number" placeholder="$" id="input1" name="input1" />
      <br>
      <label for="input2">$USD value of onchain assets:  </label>
      <input type="text" placeholder="$" id="input2" name="input2" />
      <br>
      <label for="input3">$USD value of liabilities (loans, mortgages):  </label>
      <input type="text" placeholder="$" id="input3" name="input3" />
      <br>
      <label for="input4">$USD value of loan payments missed in last 5 years:  </label>
      <input type="text" placeholder="$" id="input4" name="input4" />
      <br>
      <label for="input5">$USD value of salary/income stream:  </label>
      <input type="text" placeholder="$" id="input5" name="input5" />
      <div class="card">
      <button id="submit">Submit</button>
      </div>
    </div>
    <div id="preview" style="word-wrap: break-word;">
    </div>

  </div>
`
setupSubmit(document.querySelector<HTMLButtonElement>('#submit')!)
setupConnect(document.querySelector<HTMLButtonElement>('#connect')!)