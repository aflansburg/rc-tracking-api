const ArgumentParser = require('argparse').ArgumentParser;
let parser = new ArgumentParser({
    version: '0.0.1',
    addHelp: true,
    description: 'Arguments for rc-tracking-api'
});
parser.addArgument(
    ['-s', '--server' ],
    {
        help: 'ip addr of SAP server for db queries'
    }
)
parser.addArgument(
    ['-r', '--run' ],
    {
        helping: 'using this switch will request an update of the datasets',
        action: 'storeTrue',
    },
)

module.exports = {
    parser
}