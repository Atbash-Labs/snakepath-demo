import './style.css'
import { setupConnect } from './connect'
import { setupSubmit } from './submit'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<header>
  <h6>Sample Application:<br>Privacy-Preserving Onchain Credit Scoring</h6>
  <p>
    This sample application is meant to be a very crude demonstration 
    of Snakepath's functionality: namely, to enable public chain applications to 
    call arbitrary functions on private compute chains while preserving the privacy 
    of the inputs and validity of the outputs.
  </p>
  <p><b>
    Note: In order to use this app, you must have an account on the Goerli testnet 
    with enough testnet ethereum to make the initial transaction, faucet link here: 
    <a href="https://faucet.paradigm.xyz/" target="_blank">https://faucet.paradigm.xyz/</a>
  </b></p>
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
    Step 1: Connect your Ethereum wallet and navigate to the Goerli testnet. (MetaMask only)
    <div class="card">
    <button id="connect" type="button"></button>
    </div>
  </p>
  <p>
    Step 2: Input sample data below. (In a production flow, this encrypted data packet 
    would contain the public signature of a trusted offchain data provider. For the 
    purposes of this sample application, feel free to input arbitrary data.)
  </p>
  <div id="form">
      <form name="inputForm">    
      <label for="input1">$USD value of offchain assets:  </label>
      <input type="number" placeholder="$" id="input1" name="input1" />
      <br>
      <label for="input2">$USD value of onchain assets:  </label>
      <input type="number" placeholder="$" id="input2" name="input2" />
      <br>
      <label for="input3">$USD value of liabilities (loans, mortgages):  </label>
      <input type="number" placeholder="$" id="input3" name="input3" />
      <br>
      <label for="input4">$USD value of loan payments missed in last 5 years:  </label>
      <input type="number" placeholder="$" id="input4" name="input4" />
      <br>
      <label for="input5">$USD value of salary/income stream:  </label>
      <input type="number" placeholder="$" id="input5" name="input5" />
    </div>
  <p>
    Step 3: Sign message and transaction. MetaMask will ask for two signatures: the first one signs 
    the encrypted data, and the second signs and sends the transaction.
  </p>
  <div class="card">
    <button id="submit">Submit</button>
  </div>
</header>
  <div>
    <div id="preview" style="word-wrap: break-word;">
    </div>
    <div id="result" style="word-wrap: break-word;">
    </div>
  </div>
`
setupSubmit(document.querySelector<HTMLButtonElement>('#submit')!)
setupConnect(document.querySelector<HTMLButtonElement>('#connect')!)
