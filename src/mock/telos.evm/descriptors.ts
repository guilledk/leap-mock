import {SELF, TOKEN_CONTRACT} from "./constants.js";
import {AntelopeTransfer} from "../eosio.token/descriptors.js";
import {AssetType, Checksum160Type, NameType} from "@greymass/eosio";
import {ActionDescriptor} from "../../types.js";
import {TEVMTransaction} from "telos-evm-custom-ds";
import {LegacyTransaction} from "@ethereumjs/tx";


export class TelosEVMCreate implements ActionDescriptor {
    account: NameType = SELF;
    name: NameType = 'create';
    parameters: {
        account: NameType;
        data: string;
    };

    constructor(opts: {account: NameType}) {
        this.parameters = {account: opts.account, data: ''};
    }
}

export class TelosEVMOpenWallet implements ActionDescriptor {
    account: NameType = SELF;
    name: NameType = 'openwallet';
    parameters: {
        account: NameType;
        address: Checksum160Type;
    };

    constructor(opts: {account: NameType, address: Checksum160Type}) {
        this.parameters = opts;
    }
}

export class TelosEVMRaw implements ActionDescriptor {
    account: NameType = SELF;
    name: NameType = 'raw';
    parameters: {
        ram_payer: NameType;
        tx: Uint8Array | string;
        estimate_gas: boolean;
        sender?: Checksum160Type;
    };

    constructor(opts: {
        ram_payer: NameType,
        tx: Uint8Array | string | LegacyTransaction,
        estimate_gas: boolean,
        sender?: Checksum160Type
    }) {
        if (opts.tx instanceof LegacyTransaction)
            opts.tx = opts.tx.serialize();
        // @ts-ignore
        this.parameters = opts;
    }
}

export class TelosEVMWithdraw implements ActionDescriptor {
    account: NameType = SELF.toString();
    name: NameType = 'withdraw';
    parameters: {
        to: NameType;
        quantity: AssetType;
    };

    constructor(opts: {
        to: NameType,
        quantity: AssetType
    }) {
        this.parameters = opts;
    }
}
