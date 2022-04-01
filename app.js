const log = msg => console.log(msg);

import si from 'systeminformation';
import nosu from 'node-os-utils';

/*

    DATABASE STUFF

*/

import Realm from 'realm';

const TICK = process.env.TICK || 1000;

const MemorySchema = {
    name : "memory",
    properties : {
        _id : "int",
        // time : "int",
        // free : "int",
        used : "int"
    },
    primaryKey: "_id"
};

const MemoryStaticSchema = {
    name : "memoryStatic",
    properties : {
        total : "double"
    }
}

const NetstatSchema = {
    name : "netstats",
    properties : {
        _id : "int",
        // time : "int",
        // iface : "string",
        // operstate : "string",
        // rx_bytes : "int",
        // rx_dropped : "int",
        // rx_errors : "int",
        // tx_bytes : "int",
        // tx_dropped : "int",
        // tx_errors : "int",
        // rx_sec : "int",
        tx_sec : "int",
        // ms : "int"
    },
    primaryKey: "_id"
};

const OsInfoSchema = {
    name : "osinfo",
    properties : {
    platform: "string",
    distro: "string",
    release: "string",
    codename: "string",
    kernel: "string",
    arch: "string",
    hostname: "string",
    fqdn: "string",
    codepage: "string",
    logofile: "string",
    serial: "string",
    build: "string",
    servicepack: "string",
    uefi: "bool",
    hypervisor: "bool",
    remoteSession: "bool"
    }
};

// CPU

const CpuSchema = {
    name : "cpu",
    properties : {
        _id : "int",
        speed : "double"
    },
    primaryKey: "_id"
}

// const CpuStaticSchema = {
//     name : "cpuStatic",
//     properties : {
//         speedMax : "double"
//     }
// }

const CpuTempSchema = {
    name : "cpuTemperature",
    properties : {
        _id : "int",
        main : "int",
	    max : "int"
        // ADD SOME MORE IN HERE PROBABLY
    },
    primaryKey: "_id"
}

const realm = await Realm.open({
   // path: memory.realm,
    schema: [MemorySchema, MemoryStaticSchema, NetstatSchema, OsInfoSchema, CpuSchema, CpuTempSchema] //, CpuStaticSchema,]
});

realm.write( () => {
    realm.deleteAll();
});

// MEMORY

let memoryId = 0;

setInterval(async () => {

    // let sysMemory = await si.mem().then(data => data).catch(err => log(err));
    let memused = await nosu.mem.info().then(data => data).catch(err => log(err));


    realm.write( () => {

        realm.create("memory", {
            _id: memoryId,
            // time : si.time().current,
            // free : sysMemory.free,
            used : 100 - memused.freeMemPercentage
        });

        memoryId++;

    });

}, TICK);

let sysMemoryStatic = await si.mem().then(data => data).catch(err => log(err));
realm.write( () => {
    realm.create("memoryStatic", {
        total : sysMemoryStatic.total
    });
});

// NETWORK

let netstatsId = 0;

setInterval(async () => {

    let sysNetstats = await si.networkStats(`Ethernet 2`).then(data => data[0]).catch(err => log(err));

    realm.write( () => {

        realm.create("netstats", {
            _id : netstatsId,
            // time : si.time().current,
            // iface : sysNetstats.iface,
            // operstate : sysNetstats.operstate,
            // rx_bytes : sysNetstats.rx_bytes,
            // rx_dropped : sysNetstats.rx_dropped,
            // rx_errors : sysNetstats.rx_errors,
            // tx_bytes : sysNetstats.tx_bytes,
            // tx_dropped : sysNetstats.tx_dropped,
            // tx_errors : sysNetstats.tx_errors,
            // rx_sec : sysNetstats.rx_sec ? sysNetstats.rx_sec : 0,
            tx_sec : sysNetstats.tx_sec ? sysNetstats.rx_sec : 0,
            // ms : sysNetstats.ms
        });

        netstatsId++;

    });

}, TICK);

let sysOS = await si.osInfo().then(data => data).catch(err => log(err));

realm.write( () => {

    realm.create("osinfo", {
        platform: sysOS.platform,
        distro: sysOS.distro,
        release: sysOS.release,
        codename: sysOS.codename,
        kernel: sysOS.kernel,
        arch: sysOS.arch,
        hostname: sysOS.hostname,
        fqdn: sysOS.fqdn,
        codepage: sysOS.codename,
        logofile: sysOS.logofile,
        serial: sysOS.serial,
        build: sysOS.build,
        servicepack: sysOS.servicepack,
        uefi: sysOS.uefi,
        hypervisor: sysOS.hypervisor ? sysOS.hypervisor : false,
        remoteSession: sysOS.remoteSession ? sysOS.remoteSession : false
    });

});

let cpuId = 0;

setInterval(async () => {

    let cpuSpeedPercent = await nosu.cpu.usage().then(data => data).catch(err => log(err));

    realm.write( () => {

        realm.create("cpu", {
            _id : cpuId,
            speed : cpuSpeedPercent ? cpuSpeedPercent : 0
        });

        cpuId++;

    });

}, TICK);

// let sysCpuStatic = await si.cpu().then(data => data).catch(err => log(err));

// realm.write( () => {

//     realm.create("cpuStatic", {
//         speedMax : sysCpuStatic.speedMax ? sysCpuStatic.speedMax : 0
//     });

// });

let cpuTempId = 0;

setInterval(async () => {

    let sysCpuTemp = await si.cpuTemperature().then(data => data).catch(err => log(err));

    realm.write( () => {

        realm.create("cpuTemperature", {
            _id : cpuTempId,
            main : sysCpuTemp.main ? sysCpuTemp.main : 0,
            max : sysCpuTemp.max ? sysCpuTemp.max : 0
        });

        cpuTempId++;

    });

}, TICK);

/*

    REST API STUFF

*/

import express from 'express';

import bodyParser from 'body-parser';

const PORT = process.env.PORT || 8080;

const app = express();

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
    extended: true
}));

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(__dirname + '/public'));

/*

// memory (Get)
app.get('/memory', (req,res) => {
    const output = realm.objects("memory");
    res.status(200).send(output);
});

// netstats (Get)
app.get('/netstats', (req,res) => {
    const output = realm.objects("netstats");
    res.status(200).send(output);
});

// osInfo (Get)
app.get('/osinfo', (req,res) => {
    const output = realm.objects("osinfo");
    res.status(200).send(output);
});

*/

// SINGLE OUTPUT

app.get('/get', (req,res) => {
    const mem = realm.objects("memory");
    const memStatic = realm.objects("memoryStatic");
    const net = realm.objects("netstats");
    const os = realm.objects("osinfo");
    const cpuDynamic = realm.objects("cpu");
//    const cpuStatic = realm.objects("cpuStatic");
    const cpuTemp = realm.objects("cpuTemperature")
    const output = {
        static : {
            osinfo : os[0],
            memory : memStatic[0],
//            cpu : cpuStatic[0]
        },
        dynamic : {
            memory : mem,
            netstats : net,
            cpu : cpuDynamic,
            cpuTemperature : cpuTemp
        }
    }
    res.status(200).send(output);
});

app.listen(PORT, () => {
    console.log(`Running on http://localhost:${PORT}`);
});