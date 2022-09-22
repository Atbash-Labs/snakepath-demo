import { encrypt_payload } from "./wasm";
import { ethers } from "ethers";
import { arrayify, hexlify, SigningKey, keccak256, recoverPublicKey, computeAddress } from "ethers/lib/utils";
import { Buffer } from "buffer/";
import secureRandom from "secure-random";

export async function setupSubmit(element: HTMLButtonElement) {

    element.addEventListener("click", async function(event: Event){
        event.preventDefault()

        // generating ephemeral keys
        const wallet = ethers.Wallet.createRandom();
        const userPrivateKeyBytes = arrayify(wallet.privateKey);
        const userPublicKey: string = new SigningKey(wallet.privateKey).compressedPublicKey;
        const userPublicKeyBytes = arrayify(userPublicKey)
        //

        const gatewayPublicKey = "Ax7TzSrouCQq8bhXNuTcSsJsyRtXzM5sBBMe41unN8NW"; // get manually for now
        const gatewayPublicKeyBuffer = Buffer.from(gatewayPublicKey, "base64");
        const gatewayPublicKeyBytes = arrayify(gatewayPublicKeyBuffer);

        // @ts-ignore
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const [myAddress] = await provider.send("eth_requestAccounts", []);

        const offchain_assets = document.querySelector<HTMLFormElement>('#input1')?.value;
        const onchain_assets = document.querySelector<HTMLFormElement>('#input2')?.value;
        const liabilities = document.querySelector<HTMLFormElement>('#input3')?.value;
        const missed_payments = document.querySelector<HTMLFormElement>('#input4')?.value;
        const income = document.querySelector<HTMLFormElement>('#input5')?.value;

        const data = JSON.stringify({
        address: myAddress,
        offchain_assets: Number(offchain_assets),
        onchain_assets: Number(onchain_assets),
        liabilities: Number(liabilities),
        missed_payments: Number(missed_payments),
        income: Number(income)
        })

        const routing_info = "secret15f0xumy3rk0vdfgye8hwnzqhe8hlxdcgw6lwpt"
        const routing_code_hash = "a8505057b5e2b3cd9dfc275bddd085a894f0c055f2f2c2af64cccdd7a671c7c3"
        const user_address = myAddress
        const user_key = Buffer.from(userPublicKeyBytes)

        
        const thePayload = JSON.stringify({
            data: data,
            routing_info: routing_info,
            routing_code_hash: routing_code_hash,
            user_address: user_address,
            user_key: user_key.toString('base64'),
        })
        
        const plaintext = Buffer.from(JSON.stringify(thePayload));
        const nonce = secureRandom(12, { type: "Uint8Array" });
        const handle = "request_score"

        const ciphertext = Buffer.from(
        encrypt_payload(
            gatewayPublicKeyBytes,
            userPrivateKeyBytes,
            plaintext,
            nonce
        ));
    
        // const ciphertextHash = keccak256(ciphertext)
        // const payloadHash = '0x' + sha3.keccak256("\x19Ethereum Signed Message:\n" + 32 + ciphertextHash.substring(2))
        const payloadHash = keccak256(ciphertext)
        console.log(`Payload Hash: ${payloadHash}`)

        document.querySelector<HTMLDivElement>('#preview')!.innerHTML = `
        <h4>Raw Payload</h4>
        <p>${thePayload}</p>

        <h4>Encrypted Payload</h4>
        <p>${ciphertext.toString('base64')}</p>

        <h4>Payload Hash</h4>
        <p>${payloadHash}<p>
        `
        
        // get Metamask to sign the payloadHash
        const from = myAddress;
        const params = [from, payloadHash];  // eth_sign msgParams is just the message
        const method = 'eth_sign';
        const payloadSignature = await provider.send(method, params)
        console.log(`Payload Signature: ${payloadSignature}`)

        // recover the public key from the signature and message
        const user_pubkey = recoverPublicKey(payloadHash, payloadSignature)
        console.log(`Recovered public key: ${user_pubkey}`)
        console.log(`Verify this matches the user address: ${computeAddress(userPublicKey)}`)

        document.querySelector<HTMLDivElement>('#preview')!.innerHTML = `
        <h4>Raw Payload</h4>
        <p>${thePayload}</p>

        <h4>Encrypted Payload</h4>
        <p>${ciphertext.toString('base64')}</p>

        <h4>Payload Hash</h4>
        <p>${payloadHash}<p>

        <h4>Payload Signature</h4>
        <p>${payloadSignature}<p>
        `

        // function data to be abi encoded
        const _userAddress = myAddress
        const _sourceNetwork = "ethereum"
        const _routingInfo = routing_info
        const _payloadHash = payloadHash
        const _info = {
            user_key: hexlify(user_key),
            user_pubkey: user_pubkey,  // need the updated ABI before including this
            routing_code_hash: routing_code_hash,
            handle: handle,
            nonce: hexlify(nonce),
            payload: hexlify(ciphertext),
            payload_signature: payloadSignature
        }

        console.log(`_userAddress: ${_userAddress}
            _sourceNetwork: ${_sourceNetwork} 
            _routingInfo: ${_routingInfo} 
            _payloadHash: ${_payloadHash} 
            _info: ${JSON.stringify(_info)}`
        )
                
        // create the abi interface and encode the function data (update manually on each new deploy)
        const publicClientAddress = '0xcb4d2dF91621B32949414F095630B932275C7b8E'
        const abi = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"InvalidPayloadHash","type":"error"},{"inputs":[],"name":"InvalidSignature","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"task_id","type":"uint256"},{"indexed":false,"internalType":"bytes32","name":"payload_hash","type":"bytes32"},{"indexed":false,"internalType":"bytes32","name":"result_hash","type":"bytes32"}],"name":"logCompletedTask","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"task_id","type":"uint256"},{"indexed":false,"internalType":"string","name":"source_network","type":"string"},{"indexed":false,"internalType":"address","name":"user_address","type":"address"},{"indexed":false,"internalType":"string","name":"routing_info","type":"string"},{"indexed":false,"internalType":"string","name":"routing_code_hash","type":"string"},{"indexed":false,"internalType":"bytes","name":"payload","type":"bytes"},{"indexed":false,"internalType":"bytes32","name":"payload_hash","type":"bytes32"},{"indexed":false,"internalType":"bytes","name":"payload_signature","type":"bytes"},{"indexed":false,"internalType":"bytes","name":"user_key","type":"bytes"},{"indexed":false,"internalType":"bytes","name":"user_pubkey","type":"bytes"},{"indexed":false,"internalType":"string","name":"handle","type":"string"},{"indexed":false,"internalType":"bytes12","name":"nonce","type":"bytes12"}],"name":"logNewTask","type":"event"},{"inputs":[{"internalType":"address","name":"_masterVerificationAddress","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"masterVerificationAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_taskId","type":"uint256"},{"internalType":"string","name":"_sourceNetwork","type":"string"},{"components":[{"internalType":"bytes32","name":"payload_hash","type":"bytes32"},{"internalType":"bytes","name":"payload_signature","type":"bytes"},{"internalType":"bytes","name":"result","type":"bytes"},{"internalType":"bytes32","name":"result_hash","type":"bytes32"},{"internalType":"bytes","name":"result_signature","type":"bytes"},{"internalType":"bytes32","name":"packet_hash","type":"bytes32"},{"internalType":"bytes","name":"packet_signature","type":"bytes"}],"internalType":"struct Util.PostExecutionInfo","name":"_info","type":"tuple"}],"name":"postExecution","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"callback_address","type":"address"},{"internalType":"bytes4","name":"callback_selector","type":"bytes4"},{"internalType":"address","name":"user_address","type":"address"},{"internalType":"string","name":"source_network","type":"string"},{"internalType":"string","name":"routing_info","type":"string"},{"internalType":"bytes32","name":"payload_hash","type":"bytes32"},{"internalType":"bool","name":"completed","type":"bool"}],"internalType":"struct Util.Task","name":"_task","type":"tuple"},{"components":[{"internalType":"bytes","name":"user_key","type":"bytes"},{"internalType":"bytes","name":"user_pubkey","type":"bytes"},{"internalType":"string","name":"routing_code_hash","type":"string"},{"internalType":"string","name":"handle","type":"string"},{"internalType":"bytes12","name":"nonce","type":"bytes12"},{"internalType":"bytes","name":"payload","type":"bytes"},{"internalType":"bytes","name":"payload_signature","type":"bytes"}],"internalType":"struct Util.ExecutionInfo","name":"_info","type":"tuple"}],"name":"preExecution","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"","type":"string"}],"name":"route","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"taskId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"tasks","outputs":[{"internalType":"address","name":"callback_address","type":"address"},{"internalType":"bytes4","name":"callback_selector","type":"bytes4"},{"internalType":"address","name":"user_address","type":"address"},{"internalType":"string","name":"source_network","type":"string"},{"internalType":"string","name":"routing_info","type":"string"},{"internalType":"bytes32","name":"payload_hash","type":"bytes32"},{"internalType":"bool","name":"completed","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"_route","type":"string"},{"internalType":"address","name":"_verificationAddress","type":"address"},{"internalType":"bytes","name":"_signature","type":"bytes"}],"name":"updateRoute","outputs":[],"stateMutability":"nonpayable","type":"function"}]
        const iface= new ethers.utils.Interface( abi )
        const FormatTypes = ethers.utils.FormatTypes;
        console.log(iface.format(FormatTypes.full))
        const functionData = iface.encodeFunctionData("send",
            [
                _userAddress,
                _sourceNetwork,
                _routingInfo,
                _payloadHash,
                _info
            ]
        )

        const tx_params = [
            {
                nonce: '0x00', // ignored by MetaMask
                gasPrice: '0x3B9B1820', // 1000020000
                gas: '0x0493E0', // 300000
                to: publicClientAddress,
                from: myAddress,
                value: '0x00', // 0
                data: functionData, // TODO figure out what this data is meant to be
                chainId: "0x5"  // ignored by MetaMask
            },
          ];

        const txHash = await provider.send("eth_sendTransaction", tx_params);
        console.log(txHash)

        document.querySelector<HTMLDivElement>('#preview')!.innerHTML = `
        <h4>Raw Payload</h4>
        <p>${thePayload}</p>

        <h4>Encrypted Payload</h4>
        <p>${ciphertext.toString('base64')}</p>

        <h4>Payload Hash</h4>
        <p>${payloadHash}<p>

        <h4>Payload Signature</h4>
        <p>${payloadSignature}<p>

        <h4>Other Info</h4>
        <p>

        <b>Encryption method:</b> ChaCha20Poly1305 <br>
        <b>Public key used during encryption:</b> ${userPublicKey} <br>
        <b>Nonce used during encryption:</b> ${nonce} <br>

        </p>

        <h4>Transaction Parameters</h4>
        <p><b>Tx Hash: </b><a href="https://goerli.etherscan.io/tx/${txHash}" target="_blank">${txHash}</a></p>
        <p style="font-size: 0.8em;">${JSON.stringify(tx_params)}</p>
        `
    })
}