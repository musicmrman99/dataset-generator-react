# Dataset Generator
###### [Another one](https://github.com/musicmrman99/dataset-generator "Dataset Generator (the first one)") ...
A web app to generate a multi-table or single-table (JOINed) random dataset,
given a relational structure and generator parameters.

## Install and Build

### Install & Initial Setup

1. Install conda (anaconda or miniconda, I use miniconda): https://docs.conda.io/projects/conda/en/latest/user-guide/install/index.html
  - If using Git Bash, add conda to the git bash environment by adding `. <conda-install-dir>/etc/profile.d/conda.sh` to your `~/.bash_profile` or `~/.bashrc`.

2. Run:
```
git clone https://github.com/musicmrman99/dataset-generator-react.git dataset-generator
cd dataset-generator
conda create -y -p ./conda-env -c conda-forge --file deps.txt --file build-deps.txt
conda activate ./conda-env
npm install
```

### Build

Activate the conda env using `conda activate ./conda-env` (if not already active), then:
```
npm run webpack
```

### Run

- Live:
```
python ./dataset-generator.py
```

- Development:
```
FLASK_ENV='development' python ./dataset-generator.py
```

# Usage

It has a simple GUI - figure it out.
