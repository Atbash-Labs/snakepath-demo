import { encrypt_payload } from "./wasm";
import { ethers } from "ethers";
import { arrayify, hexlify, SigningKey, recoverPublicKey, computeAddress, randomBytes, sha256 } from "ethers/lib/utils";
import { publicKeyConvert } from "secp256k1";
import { Buffer } from "buffer/";

export async function setupSubmit(element: HTMLButtonElement) {

    element.addEventListener("click", async function(event: Event){
        event.preventDefault()

        // generating ephemeral keys
        const wallet = ethers.Wallet.createRandom();
        const userPrivateKeyBytes = arrayify(wallet.privateKey);
        const userPublicKey: string = new SigningKey(wallet.privateKey).compressedPublicKey;
        const userPublicKeyBytes = arrayify(userPublicKey)
        //

        const gatewayPublicKey = "AzzP18n/qp2odxjLHvvcCvSkf2BJWoBysim+Y00/Wi/3"; // get manually for now
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

        const inputs = JSON.stringify(
            {
                address: myAddress,
                offchain_assets: Number(offchain_assets),
                onchain_assets: Number(onchain_assets),
                liabilities: Number(liabilities),
                missed_payments: Number(missed_payments),
                income: Number(income),
            }
        )

        const routing_info = "secret108tgg5wpnu43fyklelug8hehshydmx8dsxlu99"
        const routing_code_hash = "a8505057b5e2b3cd9dfc275bddd085a894f0c055f2f2c2af64cccdd7a671c7c3"
        const user_address: string = myAddress
        const user_key = Buffer.from(userPublicKeyBytes)

        const payload = {
            data: inputs,
            routing_info: routing_info,
            routing_code_hash: routing_code_hash,
            user_address: user_address,
            user_key: user_key.toString('base64'),
        }
        
        const plaintext = Buffer.from(JSON.stringify(payload));
        const nonce = arrayify(randomBytes(12));
        const handle = "request_score"

        let ciphertext = Buffer.from(
            encrypt_payload(
                gatewayPublicKeyBytes,
                userPrivateKeyBytes,
                plaintext,
                nonce
        ));
    
        const payloadHash = sha256(ciphertext);
        console.log(`Payload Hash: ${payloadHash}`)

        document.querySelector<HTMLDivElement>('#preview')!.innerHTML = `
        <h4>Raw Payload</h4>
        <p>${plaintext}</p>

        <h4>Encrypted Payload</h4>
        <p>${ciphertext}</p>

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
        const recoveredKey = recoverPublicKey(payloadHash, payloadSignature)
        console.log(`Recovered public key: ${recoveredKey}`)
        const uncompressed_user_pubkey = publicKeyConvert(arrayify(recoveredKey),false)
        const compressed_user_pubkey = publicKeyConvert(arrayify(recoveredKey),true)
        console.log(`uncompressed_user_pubkey: ${hexlify(uncompressed_user_pubkey)}`)
        console.log(`compressed_user_pubkey: ${hexlify(compressed_user_pubkey)}`)
        
        console.log(`Verify this matches the user address: ${computeAddress(uncompressed_user_pubkey)}`)
        
        const user_pubkey = publicKeyConvert(arrayify(recoverPublicKey(arrayify(payloadHash), payloadSignature)),true)
        console.log(`user_pubkey: ${hexlify(user_pubkey)}`)

        const handle_msg = {input: { inputs: {
            task_id: 1,
            handle: handle,
            routing_info: routing_info,
            routing_code_hash: routing_code_hash,
            user_address: user_address,
            user_key: user_key.toString('base64'),
            user_pubkey: Buffer.from(user_pubkey).toString('base64'),
            payload: ciphertext.toString('base64'),
            nonce: Buffer.from(nonce).toString('base64'),
            payload_hash: Buffer.from(payloadHash.substring(2), 'hex').toString('base64'),
            payload_signature: Buffer.from(payloadSignature.substring(2,130), 'hex').toString('base64'),
            source_network: "ethereum",
        }}}
        console.log(JSON.stringify(handle_msg))
        console.log(payloadSignature.substring(2,130))

        document.querySelector<HTMLDivElement>('#preview')!.innerHTML = `
        <h4>Raw Payload</h4>
        <p>${plaintext}</p>

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
            user_pubkey: hexlify(user_pubkey),
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
        const publicClientAddress = '0x0aa42c16eaed44f7babb8a1af9228342897afe23'
        const abi = [{"inputs":[{"internalType":"address","name":"_gatewayAddress","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"taskId","type":"uint256"},{"indexed":false,"internalType":"bytes","name":"result","type":"bytes"}],"name":"ComputedResult","type":"event"},{"inputs":[],"name":"GatewayAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_taskId","type":"uint256"},{"internalType":"bytes","name":"_result","type":"bytes"}],"name":"callback","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_userAddress","type":"address"},{"internalType":"string","name":"_sourceNetwork","type":"string"},{"internalType":"string","name":"_routingInfo","type":"string"},{"internalType":"bytes32","name":"_payloadHash","type":"bytes32"},{"components":[{"internalType":"bytes","name":"user_key","type":"bytes"},{"internalType":"bytes","name":"user_pubkey","type":"bytes"},{"internalType":"string","name":"routing_code_hash","type":"string"},{"internalType":"string","name":"handle","type":"string"},{"internalType":"bytes12","name":"nonce","type":"bytes12"},{"internalType":"bytes","name":"payload","type":"bytes"},{"internalType":"bytes","name":"payload_signature","type":"bytes"}],"internalType":"struct Util.ExecutionInfo","name":"_info","type":"tuple"}],"name":"send","outputs":[],"stateMutability":"nonpayable","type":"function"}]
        const iface= new ethers.utils.Interface( abi )
        // const FormatTypes = ethers.utils.FormatTypes;
        // console.log(iface.format(FormatTypes.full))
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

   
        document.querySelector<HTMLDivElement>('#preview')!.innerHTML = `
        <h4>Raw Payload</h4>
        <p>${plaintext}</p>

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