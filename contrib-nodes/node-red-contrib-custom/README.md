# middleware-IoT

Set of nodes to ease the usage of fiware-related features and platform-managed devices
in node-red.

## Disclaimer

For now such nodes are not operational on node-red itself, but are props to the
node-red-orchestrator package that composes CPqD's IoT middleware platform.

## Running

To  install this custom set of nodes on node red, use the commands below, where **__$node_home__**
is the user's node-red home directory, usually **__~/.node-red__**; and **__$package_path__** is
the path to where this repository has been cloned into.

```shell
$ cd $node_home               # usually ~/.node-red
$ npm install $package_path   # dir where this has been cloned
```
