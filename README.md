# dive action

[![License][license-badge]][license]

dive action is an action that allows developers who develop Docker image to run [dive](https://github.com/wagoodman/dive) on GitHub Actions. dive is a tool for exploring a docker image, layer contents, and discovering ways to shrink the size of your Docker/OCI image. Integrating dive into your CI will let you reduce your container image size as early as possible.

## Usage

### Inputs

| Name        | Type   | Required | Default                              | Description                                                                  |
| ----------- | ------ | -------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| image       | String | true     |                                      | Image to analyze                                                             |
| config-file | String | false    | `${{ github.workspace }}/.dive.yaml` | Path to [dive config file](https://github.com/wagoodman/dive#ci-integration) |

### Workflow

```yaml
name: "Dive CI"

on: [push]

jobs:
  dive:
    runs-on: ubuntu-latest
    name: Analyze image efficiency
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Build image
        run: docker build -t sample:latest .
      - name: Dive
        uses: yuichielectric/dive-action@master
        with:
          image: "sample:latest"
          config-file: ${{ github.workspace }}/.dive-ci.yml
```

### Config file

There are three metrics supported by dive config file. See [here](https://github.com/wagoodman/dive#ci-integration) for details.

```yaml
rules:
  # If the efficiency is measured below X%, mark as failed.
  # Expressed as a ratio between 0-1.
  lowestEfficiency: 0.95

  # If the amount of wasted space is at least X or larger than X, mark as failed.
  # Expressed in B, KB, MB, and GB.
  highestWastedBytes: 20MB

  # If the amount of wasted space makes up for X% or more of the image, mark as failed.
  # Note: the base image layer is NOT included in the total image size.
  # Expressed as a ratio between 0-1; fails if the threshold is met or crossed.
  highestUserWastedPercent: 0.20
```

### Output

```
Unable to find image 'wagoodman/dive:v0.9' locally
v0.9: Pulling from wagoodman/dive
89d9c30c1d48: Pulling fs layer
5ac8ae86f99b: Pulling fs layer
f10575f61141: Pulling fs layer
89d9c30c1d48: Verifying Checksum
89d9c30c1d48: Download complete
f10575f61141: Verifying Checksum
f10575f61141: Download complete
5ac8ae86f99b: Verifying Checksum
5ac8ae86f99b: Download complete
89d9c30c1d48: Pull complete
5ac8ae86f99b: Pull complete
f10575f61141: Pull complete
Digest: sha256:2d3be9e9362ecdcb04bf3afdd402a785b877e3bcca3d2fc6e10a83d99ce0955f
Status: Downloaded newer image for wagoodman/dive:v0.9
  Using CI config: /.dive-ci
Image Source: docker://sample:latest
Fetching image... (this can take a while for large images)
Analyzing image...
  efficiency: 98.8091 %
  wastedBytes: 11697960 bytes (12 MB)
  userWastedPercent: 1.6116 %
Inefficient Files:
Count  Wasted Space  File Path
    6        4.9 MB  /var/cache/debconf/templates.dat
    4        3.2 MB  /var/cache/debconf/templates.dat-old
    6        1.2 MB  /var/lib/dpkg/status
    6        1.2 MB  /var/lib/dpkg/status-old
    5        400 kB  /var/log/dpkg.log
    5        211 kB  /var/log/apt/term.log
    6        107 kB  /etc/ld.so.cache
    6         83 kB  /var/cache/debconf/config.dat
    6         71 kB  /var/lib/apt/extended_states
    6         67 kB  /var/log/apt/eipp.log.xz
    5         54 kB  /var/cache/ldconfig/aux-cache
    4         40 kB  /var/cache/debconf/config.dat-old
    5         39 kB  /var/log/apt/history.log
    4         26 kB  /var/log/alternatives.log
    2        9.1 kB  /etc/mailcap
    2         903 B  /etc/group
    2         892 B  /etc/group-
    2         756 B  /etc/gshadow
    2         727 B  /var/lib/dpkg/triggers/File
    2           0 B  /usr/src
    6           0 B  /var/lib/dpkg/lock-frontend
    6           0 B  /var/lib/dpkg/lock
    5           0 B  /var/lib/apt/lists
    3           0 B  /var/lib/dpkg/triggers/Unincorp
    6           0 B  /var/lib/dpkg/updates
    5           0 B  /var/cache/apt/archives/lock
    6           0 B  /var/cache/debconf/passwords.dat
    5           0 B  /var/cache/apt/archives/partial
    2           0 B  /etc/.pwd.lock
    6           0 B  /tmp
    6           0 B  /var/lib/dpkg/triggers/Lock
Results:
  PASS: highestUserWastedPercent
  PASS: highestWastedBytes
  FAIL: lowestEfficiency: image efficiency is too low (efficiency=0.988091457351898 < threshold=0.99)
Result:FAIL [Total:3] [Passed:2] [Failed:1] [Warn:0] [Skipped:0]

##[error]Process completed with exit code 1.
```

[license-badge]: https://img.shields.io/github/license/yuichielectric/dive-action.svg
