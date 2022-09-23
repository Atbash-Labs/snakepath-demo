import { ethers } from 'ethers';

export function setupConnect(element: HTMLButtonElement) {
  element.innerHTML = `Connect Wallet (MetaMask)`
  let myAddress : string
  const connect = async () => {
    // @ts-ignore
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    [myAddress] = await provider.send("eth_requestAccounts", [])
    element.innerHTML = `Connected account: ${myAddress.substring(0,6)}...${myAddress.substring(38)}`
  }
  element.addEventListener('click', () => connect())
}