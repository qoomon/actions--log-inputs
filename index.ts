import * as core from '@actions/core'
import * as github from '@actions/github'
import {run} from './lib/actions.js'
import {fileURLToPath} from 'url'

export const action = () => run(async () => {
  const inputs = {
    redact: core.getInput('redact')?.split(',')
        ?.map((it) => it.trim())
        ?.map((it) => {
          const regexMatch = it.match(/^\/(?<pattern>.+)\/(?<flags>[igmd]*)/)
          if (regexMatch) {
            return new RegExp(regexMatch.groups?.pattern ?? '', regexMatch.groups?.flags)
          }
          return it
        }) ?? [],
  }

  let eventInputs
  switch (github.context.eventName) {
    case 'repository_dispatch':
      eventInputs = github.context.payload.client_payload
      break
    case 'workflow_dispatch':
    default:
      eventInputs = github.context.payload.inputs
  }

  if (eventInputs) {
    core.setOutput('inputs', eventInputs)
    core.info('Inputs:')
    for (const [key, value] of Object.entries(eventInputs)) {
      if (inputs.redact.some((redactPattern) => {
        if (typeof redactPattern === 'string') {
          return key === redactPattern
        }
        return redactPattern.test(key)
      })) {
        core.info(`  ${key}: ***`)
      } else {
        core.info(`  ${key}: ${JSON.stringify(value)}`)
      }

      core.setOutput(key, value)
    }
  } else {
    core.info('No inputs.')
  }
})

// Execute the action, if running as main module
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  action()
}
