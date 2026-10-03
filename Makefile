# Development helper for cubase-mcu-midiremote.
# Run `make` (or `make help`) to list all available targets.

# Where Cubase looks for MIDI Remote driver scripts. Override to match your setup.
CUBASE_SCRIPTS_DIR ?= $(HOME)/Documents/Steinberg/Cubase/MIDI Remote/Driver Scripts/Local

.PHONY: help install build watch typecheck cubase-install clean

help: ## Show this help
	@awk 'BEGIN {FS = "## "} /^[a-zA-Z_-]+:.*## / {split($$1, t, ":"); printf "  \033[36m%-16s\033[0m %s\n", t[1], $$2}' $(MAKEFILE_LIST)

install: ## Install npm dependencies
	npm install

build: ## Build all device scripts into dist/
	npm run build

watch: ## Build and watch for changes
	npm start

typecheck: ## Run the TypeScript type check
	npm run tsc

cubase-install: build ## Copy the built scripts into Cubase's MIDI Remote Driver Scripts folder
	@mkdir -p "$(CUBASE_SCRIPTS_DIR)"
	rsync -a dist/ "$(CUBASE_SCRIPTS_DIR)/"
	@echo ""
	@echo "Installed scripts to: $(CUBASE_SCRIPTS_DIR)"
	@echo "Restart Cubase to pick them up."

clean: ## Remove the dist/ folder
	rm -rf dist

.DEFAULT_GOAL := help
