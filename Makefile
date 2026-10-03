# Development helper for cubase-mcu-midiremote.
# Run `make` (or `make help`) to list all available targets.

# Where Cubase looks for MIDI Remote driver scripts. Override to match your setup.
CUBASE_SCRIPTS_DIR ?= $(HOME)/Documents/Steinberg/Cubase/MIDI Remote/Driver Scripts/Local
# Where Cubase stores the generated MIDI Remote API types (next to the scripts folder).
CUBASE_API_DIR ?= $(HOME)/Documents/Steinberg/Cubase/MIDI Remote/Driver Scripts/.api

.PHONY: help install build watch typecheck format format-check api cubase-install clean

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

format: ## Format all files with Prettier
	npx prettier --write .

format-check: ## Check that all files are formatted with Prettier
	npx prettier --check .

api: ## Copy Cubase's MIDI Remote API types into .api/ (required for typecheck)
	@if [ ! -d "$(CUBASE_API_DIR)" ]; then \
		echo "Cubase API folder not found at:"; \
		echo "  $(CUBASE_API_DIR)"; \
		echo "Launch Cubase once, then override CUBASE_API_DIR if needed."; \
		exit 1; \
	fi
	@mkdir -p .api
	rsync -a "$(CUBASE_API_DIR)/" .api/
	@echo "Copied MIDI Remote API types to .api/"

cubase-install: build ## Copy the built scripts into Cubase's MIDI Remote Driver Scripts folder
	@mkdir -p "$(CUBASE_SCRIPTS_DIR)"
	rsync -a dist/ "$(CUBASE_SCRIPTS_DIR)/"
	@echo ""
	@echo "Installed scripts to: $(CUBASE_SCRIPTS_DIR)"
	@echo "Restart Cubase to pick them up."

clean: ## Remove the dist/ folder
	rm -rf dist

.DEFAULT_GOAL := help
